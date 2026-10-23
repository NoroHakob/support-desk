import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CodeBlock } from "@/components/dashboard/code-block";
import { PageHeader } from "@/components/dashboard/page-header";
import { WorkspaceName } from "@/components/dashboard/workspace-name";
import { WidgetSettings } from "@/components/widget-settings/widget-settings";
import { getMockSources } from "@/lib/mock/sources";
import { getMockWidgetSettings } from "@/lib/mock/widget";
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
  const workspace = await getQueryClient().fetchQuery(
    orpc.workspace.current.queryOptions(),
  );
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
    <>
      <PageHeader
        title="Home"
        description={
          <>
            Set up the widget for <WorkspaceName /> and see it as visitors do.
          </>
        }
      />
      <WidgetSettings
        initialSettings={getMockWidgetSettings(workspace.name)}
        initialSources={getMockSources()}
        avatarSeed={workspace.id}
        snippet={
          <CodeBlock code={snippet} language="html" filename="index.html" />
        }
      />
    </>
  );
}
