import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { PlaceholderPanel } from "@/components/dashboard/placeholder-panel";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <>
      <PageHeader
        title="Inbox"
        description="Conversations with your visitors, as they happen."
      />
      <PlaceholderPanel>
        Conversations will show up here once your widget is live.
      </PlaceholderPanel>
    </>
  );
}
