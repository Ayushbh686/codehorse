"use server";

import prisma from "@/lib/db";

export type SubscriptionTier = 'FREE' | 'PRO'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED'

export interface UserLimits {
    tier: SubscriptionTier;
    repositories: {
        current: number;
        limit: number | null;
        canAdd: boolean;
    };
    reviews: {
        [repositoryId: string]: {
            current: number;
            limit: number | null;
            canAdd: boolean;
        }
    };
}

const TIER_LIMITS = {
    FREE: {
        repositories: 5,
        reviewsPerRepo: 5,
    },
    PRO: {
        repositories: null, // Unlimited
        reviewsPerRepo: null, // Unlimited
    }
} as const;

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true },
    })
    return (user?.subscriptionTier as SubscriptionTier) || 'FREE';
}

export async function getUserUsage(userId: string) {
    let usage = await prisma.userUsage.findUnique({
        where: { userId },
    })
    if (!usage) {
        usage = await prisma.userUsage.create({
            data: {
                userId,
                repositoryCount : 0,
                reviewCounts: {}, 
            }
        })
    }
    return usage;
}

export const canConnectRepository = async (userId: string): Promise<boolean> => {
    const tier = await getUserTier(userId);
    if (tier === "PRO") {
        return true; // PRO users have no limits
    }
    const usage = await getUserUsage(userId);
    const limit = TIER_LIMITS.FREE.repositories;

    return usage.repositoryCount < limit;
}

export const cancreateReview = async (userId: string, repositoryId: string): Promise<boolean> => {
    const tier = await getUserTier(userId);
    if (tier === "PRO") {
        return true; // PRO users have no limits
    }
    const usage = await getUserUsage(userId);
    const reviewCounts = usage.reviewCounts as Record<string, number>;
    const currentCount = reviewCounts[repositoryId] || 0;
    const limit = TIER_LIMITS.FREE.reviewsPerRepo;
    return currentCount < limit;
}

// Increment repository count for user
export const incrementRepositoryCount = async (userId: string) : Promise<void> => {
    await prisma.userUsage.upsert({
        where: { userId },
        create: {
            userId,
            repositoryCount: 1,
            reviewCounts: {},
        }, 
        update: {
            repositoryCount: {
                increment: 1,
            }
        }
    })
}

export const decrementRepositoryCount = async (userId: string , amount = 1) : Promise<void> => {
    const usage = await getUserUsage(userId);
    await prisma.userUsage.update({
        where: { userId },
        data: {
            repositoryCount: Math.max(0, usage.repositoryCount - 1),
        }
    })
}

export const incrementReviewCount = async (userId: string, repositoryId: string) : Promise<void> => {
    const usage = await getUserUsage(userId);
    const reviewCounts = usage.reviewCounts as Record<string, number>;
    reviewCounts[repositoryId] = (reviewCounts[repositoryId] || 0) + 1;

    await prisma.userUsage.update({
        where: { userId },
        data: {
            reviewCounts,
        }
    })
}

export const getRemainingLimits = async (userId: string): Promise<UserLimits> => {
    const tier = await getUserTier(userId);
    const usage = await getUserUsage(userId);
    const reviewCounts = usage.reviewCounts as Record<string, number>;

    const limits : UserLimits = {
        tier,
        repositories: {
            current: usage.repositoryCount,
            limit: tier === 'PRO' ? null : TIER_LIMITS.FREE.repositories,
            canAdd: tier === 'PRO' || usage.repositoryCount < TIER_LIMITS.FREE.repositories,
        },
        reviews: {},
    }

    const repositories = await prisma.repository.findMany({
        where: { userId },
        select: { id: true },
    })

    for (const repo of repositories) {
        const currentCount = reviewCounts[repo.id] || 0;
        limits.reviews[repo.id] = {
            current: currentCount,
            limit: tier === 'PRO' ? null : TIER_LIMITS.FREE.reviewsPerRepo,
            canAdd: tier === 'PRO' || currentCount < TIER_LIMITS.FREE.reviewsPerRepo,
        }
    }

    return limits;
}

export const updateUserTier = async (
    userId: string,
    tier: SubscriptionTier,
    status: SubscriptionStatus,
    polarSubscriptionId?: string
): Promise<void> => {
    await prisma.user.update({
        where: { id: userId },
        data: {
            subscriptionTier: tier,
            subscriptionStatus: status,
            ...(polarSubscriptionId && {
                polarSubscriptionId,
            }),
        }
    })
}

// export const updateRazorpayCustomerId = async (
//     userId: string,
//     razorpayCustomerId: string
// ) : Promise<void> => {
//     await prisma.user.update({
//         where: { id: userId },
//         data: {
//             razorpayCustomerId,
//         }
//     })
// }

export async function updatePolarCustomerId(
    userId: string,
    polarCustomerId: string
): Promise<void> {
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            polarCustomerId,
        },
    });
}