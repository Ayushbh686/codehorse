// src/inngest/functions.ts
import prisma from "@/lib/db";
import { inngest } from "../client";
import { getRepoFileContents } from "@/module/github/lib/github";
import { indexCodeBase } from "@/module/ai/lib/rag";

export const indexRepo = inngest.createFunction(
  {
    id: "index-repo",
    triggers: [{ event: "repository.connected" }],
  },
  async ({ event, step }) => {
    const { owner, repo, userId } = event.data;

    // fetch all the files
    const files = await step.run("fetch-files", async () => {
      const account = await prisma.account.findFirst({
        where: {
          userId,
          providerId: "github",
        },
      });

      if (!account?.accessToken) {
        throw new Error("No github access token found");
      }

      return await getRepoFileContents(account.accessToken, owner, repo);
    });

    await step.run("index-codebase", async () => {
      await indexCodeBase(`${owner}/${repo}`, files);
    });

    return { success:true, indexedFiles: files.length}
  },
);
