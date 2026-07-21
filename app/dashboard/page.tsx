"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  GitCommit,
  GitPullRequest,
  MessageSquare,
  GitBranch,
} from "lucide-react";
import {
  getDashboardStats,
  getMonthlyActivity,
} from "@/module/dashboard/actions";
import ContributionGraph from "@/module/dashboard/components/contribution-graph";
import { Spinner } from "@/components/ui/spinner";

const MainPage = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => await getDashboardStats(),
    refetchOnWindowFocus: false,
  });

  const { data: monthlyData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["monthly-activity"],
    queryFn: async () => await getMonthlyActivity(),
    refetchOnWindowFocus: false,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">GitHub Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Commits"
          value={stats?.totalCommits}
          icon={<GitCommit className="h-5 w-5" />}
          loading={statsLoading}
        />

        <StatCard
          title="Pull Requests"
          value={stats?.totalPRs}
          icon={<GitPullRequest className="h-5 w-5" />}
          loading={statsLoading}
        />

        <StatCard
          title="Reviews"
          value={stats?.totalReviews}
          icon={<MessageSquare className="h-5 w-5" />}
          loading={statsLoading}
        />

        <StatCard
          title="Repositories"
          value={stats?.totalRepos}
          icon={<GitBranch className="h-5 w-5" />}
          loading={statsLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribution Activity</CardTitle>
          <CardDescription>
            Visualising your coding frequency over the last year
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-center">
          <ContributionGraph />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>Last 6 months GitHub activity</CardDescription>
          </CardHeader>

          <CardContent>
            {isLoadingActivity ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Spinner />
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />

                    <Legend />

                    <Bar
                      dataKey="commits"
                      name="Commits"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="prs"
                      name="Pull Requests"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="reviews"
                      name="AI Reviews"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainPage;

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "..." : (value ?? 0)}
        </div>
      </CardContent>
    </Card>
  );
}
