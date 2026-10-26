import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardAccentProvider } from "@/components/dashboard/accent-provider";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardRealtime } from "@/components/dashboard/dashboard-realtime";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isApprovedOwner } from "@/lib/auth/owners";
import { verifyEmailHref } from "@/lib/auth/routes";
import { auth } from "@/lib/auth/server";
import { memberAvatarUri } from "@/lib/avatar";
import { orpc } from "@/lib/orpc";
import { getQueryClient } from "@/lib/query/server";
import { displayName, initials } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  const { user } = session;
  if (!isApprovedOwner(user.email)) {
    redirect("/auth/not-approved");
  }
  if (!user.emailVerified) {
    redirect(verifyEmailHref(user.email));
  }

  const queryClient = getQueryClient();
  const workspace = await queryClient.fetchQuery(
    orpc.workspace.current.queryOptions(),
  );
  if (!workspace) {
    redirect("/auth/welcome");
  }
  const widgetSettings = await queryClient.fetchQuery(
    orpc.widgetSettings.get.queryOptions(),
  );

  const name = displayName(user);
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardAccentProvider initialColor={widgetSettings.color}>
        <DashboardRealtime workspaceId={workspace.id} />
        <TooltipProvider delay={400}>
          <SidebarProvider
            defaultOpen={sidebarOpen}
            style={{ "--header-height": "3.5rem" } as React.CSSProperties}
          >
            <AppSidebar
              user={{
                name,
                email: user.email,
                avatarUrl: user.image ?? memberAvatarUri(name),
                initials: initials(name),
              }}
            />
            <SidebarInset className="min-w-0 brand-wash">
              <SiteHeader />
              <div className="flex flex-1 flex-col">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </DashboardAccentProvider>
    </HydrationBoundary>
  );
}
