"use client";

import {
  assertNever,
  workspaceEventSchema,
  type ConversationState,
  type ConversationSummary,
  type WorkspaceEvent,
} from "@marshaldesk/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { playNotificationSound } from "@/lib/notification-sound";
import { client, orpc } from "@/lib/orpc";
import { lastMessagePreview, visitorTitle } from "@/lib/visitor";

const BADGE_PATTERN = /^\(\d+\) /;

// PRD D-6: conversations the agent is handling don't notify.
function needsOwner(state: ConversationState) {
  switch (state) {
    case "waiting":
    case "human":
      return true;
    case "ai":
    case "closed":
      return false;
    default:
      return assertNever(state);
  }
}

function isViewing(conversationId: string) {
  return (
    document.visibilityState === "visible" &&
    window.location.pathname === "/dashboard/inbox" &&
    new URLSearchParams(window.location.search).get("c") === conversationId
  );
}

// Next.js rewrites the title on navigation, so the count is put back whenever
// the title changes.
function useTabBadge(count: number) {
  useEffect(() => {
    function apply() {
      const base = document.title.replace(BADGE_PATTERN, "");
      const next = count > 0 ? `(${count}) ${base}` : base;
      if (document.title !== next) document.title = next;
    }
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => {
      observer.disconnect();
      document.title = document.title.replace(BADGE_PATTERN, "");
    };
  }, [count]);
}

/**
 * Keeps the inbox live on every dashboard page and notifies the owner about
 * new visitor messages that need them (PRD D-6).
 */
export function DashboardRealtime({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const listKey = orpc.inbox.list.queryKey();
  const { data: conversations } = useQuery(orpc.inbox.list.queryOptions());
  const unreadCount =
    conversations?.filter(
      (conversation) => conversation.unread && needsOwner(conversation.state),
    ).length ?? 0;
  useTabBadge(unreadCount);

  function notify(conversation: ConversationSummary) {
    if (isViewing(conversation.id)) return;
    playNotificationSound();
    if (
      document.visibilityState === "visible" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }
    const notification = new Notification(
      visitorTitle(conversation.visitor.details),
      { body: lastMessagePreview(conversation), tag: conversation.id },
    );
    notification.onclick = () => {
      window.focus();
      router.push(`/dashboard/inbox?c=${conversation.id}`);
      notification.close();
    };
  }

  function apply(event: WorkspaceEvent) {
    switch (event.type) {
      case "conversation.updated": {
        const { conversation } = event;
        // Publishes can arrive out of order; every change moves lastMessageAt.
        queryClient.setQueryData(listKey, (list) => {
          if (!list) return list;
          const current = list.find((item) => item.id === conversation.id);
          if (!current) return [conversation, ...list];
          if (current.lastMessageAt > conversation.lastMessageAt) return list;
          return list.map((item) =>
            item.id === conversation.id ? conversation : item,
          );
        });
        void queryClient.invalidateQueries({
          queryKey: orpc.inbox.conversation.queryKey({
            input: { id: conversation.id },
          }),
        });
        if (event.visitorMessageId && needsOwner(conversation.state)) {
          notify(conversation);
        }
        break;
      }
      case "conversation.read":
        queryClient.setQueryData(listKey, (list) =>
          list?.map((item) =>
            item.id === event.conversationId
              ? { ...item, unread: false }
              : item,
          ),
        );
        queryClient.setQueryData(
          orpc.inbox.conversation.queryKey({
            input: { id: event.conversationId },
          }),
          (conversation) =>
            conversation ? { ...conversation, unread: false } : conversation,
        );
        break;
      default:
        return assertNever(event);
    }
  }

  useRealtimeRoom({
    party: "workspace",
    room: workspaceId,
    schema: workspaceEventSchema,
    getToken: async () =>
      (await client.realtime.getToken({ party: "workspace" })).token,
    onEvent: apply,
    onSync: () =>
      void queryClient.invalidateQueries({ queryKey: orpc.inbox.key() }),
  });

  return null;
}
