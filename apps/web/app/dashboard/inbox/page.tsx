import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import * as z from "zod";

import { PageHeader } from "@/components/dashboard/page-header";
import { Inbox } from "@/components/inbox/inbox";
import { orpc } from "@/lib/orpc";
import { getQueryClient } from "@/lib/query/server";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage({
  searchParams,
}: PageProps<"/dashboard/inbox">) {
  const queryClient = getQueryClient();
  const openId = z.uuid().safeParse(firstParam((await searchParams).c));
  await Promise.all([
    queryClient.prefetchQuery(orpc.inbox.list.queryOptions()),
    openId.success
      ? queryClient.prefetchQuery(
          orpc.inbox.conversation.queryOptions({ input: { id: openId.data } }),
        )
      : null,
  ]);

  return (
    <div className="flex h-[calc(100svh-var(--header-height))] flex-col md:h-[calc(100svh-var(--header-height)-1rem)]">
      <PageHeader
        title="Inbox"
        description="Conversations with your visitors. Waiting ones need you."
      />
      <div className="flex min-h-0 min-w-0 flex-1 px-4 pb-4 lg:px-6 lg:pb-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Inbox />
        </HydrationBoundary>
      </div>
    </div>
  );
}
