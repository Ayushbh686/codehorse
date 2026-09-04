"use server";

import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { getPullrequestDiff } from "@/module/github/lib/github";
import { cancreateReview, incrementReviewCount } from "@/module/payment/lib/subscription";
import { success } from "better-auth";

export async function reviewPullRequest(
  owner: string,
  repo: string,
  prNumber: number,
) {
  try {
    const repository = await prisma.repository.findFirst({
      where: {
        owner,
        name: repo,
      },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                providerId: "github",
              },
            },
          },
        },
      },
    });

    if (!repository) {
      throw new Error("Repository not found");
    }

    const canReview = await cancreateReview(repository.user.id, repository.id);
    if (!canReview) {
      throw new Error(
        `Review limit reached for repository ${owner}/${repo}. Please upgrade your subscription or wait until the limit resets.`,
      );
    }

    const githubAccount = repository.user.accounts[0];

    if (!githubAccount?.accessToken) {
      throw new Error("GitHub access token missing");
    }

    const token = githubAccount.accessToken;

    const { title } = await getPullrequestDiff(token, owner, repo, prNumber);

    // Send async job to Inngest
    await inngest.send({
      name: "pr.review.requested",
      data: {
        owner,
        repo,
        prNumber,
        userId: repository.user.id,
      },
    });

    await incrementReviewCount(repository.user.id , repository.id);

    return {success : true , message : "Review Queued"}
  } catch (error) {
    try {
      const repository = await prisma.repository.findFirst({
        where: {
          owner,
          name: repo,
        },
      });

      if (repository) {
        await prisma.review.create({
          data: {
            repositoryId: repository.id,
            prNumber,
            prTitle: "Failed to fetch PR",
            prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
            review:
              error instanceof Error
                ? error.message
                : "Unknown error occurred while fetching PR",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      console.error("Failed to store failed review:", dbError);
    }

    return {
      success: false,
      message: "Failed to queue review",
    };
  }
}
