import { widgetHostSchema } from "@marshaldesk/shared";
import type { Metadata } from "next";

import { WidgetApp } from "@/components/widget/widget-app";
import { client } from "@/lib/orpc";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Chat" };

// Loaded by the embed script in an iframe. On a domain that isn't allowed it
// renders nothing, so the launcher never appears (PRD checklist 21).
export default async function WidgetPage({
  params,
  searchParams,
}: PageProps<"/widget/[workspaceId]">) {
  const { workspaceId } = await params;
  const host = widgetHostSchema.safeParse(
    firstParam((await searchParams).host),
  );
  if (!host.success) {
    return null;
  }
  const config = await client.widget
    .config({ workspaceId, host: host.data })
    .catch(() => null);
  if (!config) {
    return null;
  }
  return (
    <WidgetApp workspaceId={workspaceId} host={host.data} config={config} />
  );
}
