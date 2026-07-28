"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Star, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRepositories } from "@/module/repository/hooks/use-repositories";
import { RepositoryListSkeleton } from "@/module/repository/components/repository-skeleton";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  isConnected?: boolean;
}

const RepositoryPage = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRepositories();

  const [searchQuery, setSearchQuery] = useState("");
  const [connectingId, setConnectingId] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
      },
    );

    const currentTarget = observerTarget.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Manage and view all your GitHub repositories
          </p>
        </div>

        <RepositoryListSkeleton />
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">Failed to load repositories</p>;
  }

  const allRepositories: Repository[] =
    data?.pages.flatMap((page: Repository[]) => page) ?? [];

  const filteredRepositories = allRepositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleConnect = (repo: Repository) => {};

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground">
          Manage and view all your GitHub repositories
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredRepositories.map((repo) => {
          const isConnecting = connectingId === repo.id;

          return (
            <Card key={repo.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{repo.name}</CardTitle>

                      <Badge variant="outline">
                        {repo.language || "Unknown"}
                      </Badge>

                      {repo.isConnected && (
                        <Badge variant="secondary">Connected</Badge>
                      )}
                    </div>

                    {repo.description && (
                      <CardDescription>{repo.description}</CardDescription>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${repo.name} on GitHub`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                      })}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>

                    <Button
                      onClick={() => handleConnect(repo)}
                      disabled={isConnecting || repo.isConnected}
                      variant={repo.isConnected ? "outline" : "default"}
                    >
                      {isConnecting
                        ? "Connecting..."
                        : repo.isConnected
                          ? "Connected"
                          : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-medium">
                    {repo.stargazers_count}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredRepositories.length === 0 && (
          <p className="text-sm text-muted-foreground">No repositories found</p>
        )}

        <div ref={observerTarget} className="py-4">
          {isFetchingNextPage && <RepositoryListSkeleton />}

          {!hasNextPage && allRepositories.length > 0 && (
            <p className="text-center text-muted-foreground">
              No more repositories
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryPage;
