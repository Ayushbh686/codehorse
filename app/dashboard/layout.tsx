import React, { Suspense } from "react";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/ui/app-sidebar";

import { requireAuth } from "@/module/auth/utils/auth-utils";

const AuthenticatedDashboard = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await requireAuth();

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-4 px-4">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="mx-2 h-4" />

          <h1 className="text-xl font-semibold text-foreground">
            Dashboard
          </h1>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

const DashboardLoading = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar skeleton */}
        <aside className="hidden w-64 border-r p-4 md:block">
          <div className="mb-8 h-8 w-32 animate-pulse rounded-md bg-muted" />

          <div className="space-y-3">
            <div className="h-9 animate-pulse rounded-md bg-muted" />
            <div className="h-9 animate-pulse rounded-md bg-muted" />
            <div className="h-9 animate-pulse rounded-md bg-muted" />
            <div className="h-9 animate-pulse rounded-md bg-muted" />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="flex h-16 items-center gap-3 border-b px-4">
            <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />

            <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
          </header>

          {/* Content */}
          <main className="flex-1 space-y-6 p-4 md:p-6">
            <div>
              <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
              <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </div>

            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuthenticatedDashboard>
        {children}
      </AuthenticatedDashboard>
    </Suspense>
  );
};

export default DashboardLayout;