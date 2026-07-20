import { Octokit } from "octokit";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/* ================================
   Contribution Types
================================ */

interface ContributionDay {
  contributionCount: number;
  date: string; // ISO string from GitHub
  color: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

interface ContributionData {
  user: {
    contributionsCollection: {
      contributionCalendar: ContributionCalendar;
    };
  };
}



// getting the github access token

// export const getGithubToken = async () => {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session) {
//     throw new Error("Unauthorized");
//   }

//   const account = await prisma.account.findFirst({
//     where: {
//       userId: session.user.id,
//       providerId: "github",
//     },
//   });

//   if (!account?.accessToken) {
//     throw new Error("No github access token found");
//   }

//   return account.accessToken;
// };

//better direct way for getting github access token
export const getGithubToken = async () => {
  const { accessToken } = await auth.api.getAccessToken({
    body: {
      providerId: "github",
    },
    headers: await headers(),
  });

  if (!accessToken) {
    throw new Error("No GitHub access token found");
  }

  return accessToken;
};



// fetching github contributions

export async function fetchUserContribution(token: string, username: string) {
  const octokit = new Octokit({ auth: token });

  const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response:ContributionData = await octokit.graphql(query , {username});
    
    return response.user.contributionsCollection.contributionCalendar;
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    return null;
  }
}
