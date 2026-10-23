import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { Inbox } from "@/components/inbox/inbox";
import { visitorAvatarUri } from "@/lib/avatar";
import { getMockConversations } from "@/lib/mock/conversations";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage({
  searchParams,
}: PageProps<"/dashboard/inbox">) {
  const conversations = getMockConversations();
  const avatars = Object.fromEntries(
    conversations.map(({ visitor }) => [
      visitor.id,
      visitorAvatarUri(visitor.id),
    ]),
  );

  return (
    <div className="flex h-[calc(100svh-var(--header-height))] flex-col md:h-[calc(100svh-var(--header-height)-1rem)]">
      <PageHeader
        title="Inbox"
        description="Conversations with your visitors. Waiting ones need you."
      />
      <div className="flex min-h-0 min-w-0 flex-1 px-4 pb-4 lg:px-6 lg:pb-6">
        <Inbox
          initialConversations={conversations}
          initialOpenId={firstParam((await searchParams).c) ?? null}
          avatars={avatars}
        />
      </div>
    </div>
  );
}
