"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteWebhook } from "@/module/github/lib/github";
import { decrementRepositoryCount } from "@/module/payment/lib/subscription";
import { deleteRepositoryFromPinecone } from "@/module/ai/lib/rag";

export async function getUserProfile() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error while fetghing user profike", error);
    return null;
  }
}

export async function updateUserProfile(data?: {
  name?: string;
  email?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const updateUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: data?.name,
        email: data?.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        // image:true,
        // createdAt: true
      },
    });

    revalidatePath("dashboard/settings", "page");

    return {
      success: true,
      user: updateUser,
    };
  } catch (error) {
    console.error("Error while upadeing user profile", error);
    return null;
  }
}

export const getConnectedRepo = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        url: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return repositories;
  } catch (error) {
    console.error("Erroe fetching connected repo: ", error);
    return [];
  }
};

export const disconnectRepo = async (repositoryId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const repository = await prisma.repository.findUnique({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    });

    if (!repository) {
      throw new Error("Unauthorized");
    }

    await deleteWebhook(repository.owner, repository.name);

    await prisma.repository.delete({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    });

    // Decrement repository count for usage tracking
    await decrementRepositoryCount(session.user.id);
    // Delete repository vectors from Pinecone
    await deleteRepositoryFromPinecone(repository.fullName);

    revalidatePath("/dashboard/settings", "page");
    revalidatePath("/dashboard/repository", "page");

    return true;
  } catch (error) {
    console.error("Failed to disconnect repository:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to disconnect repository",
    };
  }
};

export const disconnectAllRepos = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
    });

    await Promise.all(
      repositories.map(async (repo) => {
        await deleteWebhook(repo.owner, repo.name);
        await deleteRepositoryFromPinecone(repo.fullName);
      }),
    );

    const result = await prisma.repository.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    // Decrement repository count to zero for usage tracking
    await prisma.userUsage.update({
      where: { userId: session.user.id },
      data: {
        repositoryCount: 0,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/repository");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Failed to disconnect all repositories:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to disconnect all repositories",
    };
  }
};
