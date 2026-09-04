import { pineconeIndex } from "@/lib/pinecone";
import { embed, embedMany } from "ai";
import { jina } from "jina-ai-provider";

const EMBEDDING_MODEL = "jina-code-embeddings-1.5b";

export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: jina.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  });

  return embedding;
}

export async function indexCodeBase(
  repoId: string,
  files: { path: string; content: string }[],
) {
  const validFiles = files.filter(
    (file) =>
      !file.path.includes("node_modules") &&
      !file.path.includes(".next") &&
      !file.path.includes("dist") &&
      file.path !== "package-lock.json" &&
      file.path !== "yarn.lock" &&
      file.path !== "pnpm-lock.yaml",
  );

  const texts = validFiles.map(
    (file) =>
      `File: ${file.path}\n\n${file.content.slice(0, 8000)}`,
  );

  if (texts.length === 0) {
    console.log("No files to index");
    return;
  }

  const { embeddings } = await embedMany({
    model: jina.textEmbeddingModel(EMBEDDING_MODEL),
    values: texts,
  });

  const vectors = validFiles.map((file, index) => ({
    id: `${repoId}-${file.path.replace(/\//g, "_")}`,
    values: embeddings[index],
    metadata: {
      repoId,
      path: file.path,
      content: file.content.slice(0, 8000),
    },
  }));

  for (let i = 0; i < vectors.length; i += 100) {
    await pineconeIndex.upsert({
      records: vectors.slice(i, i + 100),
    });
  }

  console.log(`Indexing complete: ${vectors.length} files`);
}

export async function retrieveContext(
  query: string,
  repoId: string,
  topK: number = 5,
) {
  const embedding = await generateEmbedding(query);

  const results = await pineconeIndex.query({
    vector: embedding,
    filter: { repoId },
    topK,
    includeMetadata: true,
  });

  return results.matches
    .map((match) => match.metadata?.content as string)
    .filter(Boolean);
}

export const deleteRepositoryFromPinecone = async (repoId: string) => {
  try {
    await pineconeIndex.deleteMany({
      filter: {
        repoId: {
          $eq: repoId,
        },
      },
    });

    console.log(`Deleted vectors for repo ${repoId}`);
  } catch (error) {
    console.error("Failed to delete repository from Pinecone:", error);
  }
};