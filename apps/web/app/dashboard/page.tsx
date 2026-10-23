import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CodeBlock } from "@/components/dashboard/code-block";
import { WorkspaceName } from "@/components/dashboard/workspace-name";
import { WidgetSettings } from "@/components/widget-settings/widget-settings";
import { orpc } from "@/lib/orpc";
import { getQueryClient } from "@/lib/query/server";

async function appOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function HomePage() {
  const queryClient = getQueryClient();
  const [workspace] = await Promise.all([
    queryClient.fetchQuery(orpc.workspace.current.queryOptions()),
    queryClient.prefetchQuery(orpc.widgetSettings.get.queryOptions()),
    queryClient.prefetchQuery(orpc.knowledge.sources.queryOptions()),
  ]);
  if (!workspace) {
    redirect("/auth/welcome");
  }

  const snippet = [
    "<script",
    `  src="${await appOrigin()}/embed.js"`,
    `  data-workspace="${workspace.id}"`,
    "  async",
    "></script>",
  ].join("\n");

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WidgetSettings
        description={
          <>
            Set up the widget for <WorkspaceName /> and see it as visitors do.
          </>
        }
        avatarSeed={workspace.id}
        snippet={
          <CodeBlock code={snippet} language="html" filename="index.html" />
        }
      />
    </HydrationBoundary>
  );
}
