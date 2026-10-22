import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
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

  const name = displayName(user);
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </HydrationBoundary>
  );
}
