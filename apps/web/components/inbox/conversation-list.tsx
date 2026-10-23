"use client";

import type { ConversationSummary } from "@marshaldesk/shared";
import { cn } from "cn";
import { Inbox } from "lucide-react";

import { StateBadge } from "@/components/inbox/state-badge";
import { VisitorAvatar } from "@/components/inbox/visitor-avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { conversationStates, stateLabel } from "@/lib/conversation-copy";
import { formatShortAgo } from "@/lib/format";
import { lastMessagePreview, visitorTitle } from "@/lib/visitor";

export const inboxFilters = ["all", ...conversationStates] as const;
export type InboxFilter = (typeof inboxFilters)[number];

function filterLabel(filter: InboxFilter) {
  return filter === "all" ? "All" : stateLabel(filter);
}

export function ConversationList({
  conversations,
  filter,
  selectedId,
  avatars,
  onFilterChange,
  onSelect,
}: {
  conversations: ConversationSummary[];
  filter: InboxFilter;
  selectedId: string | null;
  avatars: Record<string, string>;
  onFilterChange: (filter: InboxFilter) => void;
  onSelect: (id: string) => void;
}) {
  const waitingCount = conversations.filter(
    (conversation) => conversation.state === "waiting",
  ).length;
  const visible = conversations
    .filter((conversation) => filter === "all" || conversation.state === filter)
    .toSorted(
      (a, b) =>
        Number(b.state === "waiting") - Number(a.state === "waiting") ||
        b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-2">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            const next = inboxFilters.find((item) => item === value);
            if (next) onFilterChange(next);
          }}
        >
          <TabsList className="w-full">
            {inboxFilters.map((item) => (
              <TabsTrigger key={item} value={item} className="px-1">
                {filterLabel(item)}
                {item === "waiting" && waitingCount > 0 ? (
                  <span className="text-xs text-primary tabular-nums">
                    {waitingCount}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {visible.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Nothing here</EmptyTitle>
            <EmptyDescription>
              {filter === "all"
                ? "Conversations show up here once visitors start chatting."
                : `No conversations in ${filterLabel(filter).toLowerCase()} right now.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="divide-y">
            {visible.map((conversation) => {
              const selected = conversation.id === selectedId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors duration-150 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                      selected && "bg-muted hover:bg-muted",
                    )}
                  >
                    <VisitorAvatar src={avatars[conversation.visitor.id]} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            conversation.unread
                              ? "font-semibold"
                              : "font-medium",
                          )}
                        >
                          {visitorTitle(conversation.visitor.details)}
                        </span>
                        <span
                          className="shrink-0 text-xs text-muted-foreground tabular-nums"
                          suppressHydrationWarning
                        >
                          {formatShortAgo(conversation.lastMessageAt)}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            conversation.unread
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {lastMessagePreview(conversation)}
                        </span>
                        {conversation.unread ? (
                          <span className="size-2 shrink-0 rounded-full bg-primary">
                            <span className="sr-only">Unread</span>
                          </span>
                        ) : null}
                        <StateBadge state={conversation.state} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
