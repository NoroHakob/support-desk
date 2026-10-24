import type { findConversation } from "@marshaldesk/db";
import {
  encodeRealtimeEvent,
  summarizeConversation,
  type ConversationServerEvent,
  type RealtimeParty,
  type WorkspaceEvent,
} from "@marshaldesk/shared";

import {
  toConversation,
  toWidgetConversation,
} from "@/server/conversation-dto";

type ConversationRow = NonNullable<
  Awaited<ReturnType<typeof findConversation>>
>;

/** Next's `after()`, passed in by the route handlers through the context. */
export type Defer = (task: () => Promise<void>) => void;

const PUBLISH_TIMEOUT_MS = 2000;

let warnedMissingConfig = false;

// Runs after the response is sent. The write is already saved, so a failed
// publish is only logged: clients catch up from the API when they reconnect.
function publish(
  defer: Defer | undefined,
  party: RealtimeParty,
  room: string,
  body: string,
) {
  const baseUrl = process.env.REALTIME_URL;
  const secret = process.env.REALTIME_PUBLISH_SECRET;
  if (!baseUrl || !secret) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        "Real time is off: set REALTIME_URL and REALTIME_PUBLISH_SECRET.",
      );
    }
    return;
  }
  (defer ?? ((task) => void task()))(async () => {
    try {
      const response = await fetch(
        new URL(`/parties/${party}/${room}`, baseUrl),
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${secret}`,
            "content-type": "application/json",
          },
          body,
          signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS),
        },
      );
      if (!response.ok) {
        console.error(
          `Publishing to ${party}/${room} failed with status ${response.status}.`,
        );
      }
    } catch (error) {
      console.error(`Publishing to ${party}/${room} failed.`, error);
    }
  });
}

export function publishConversationEvent(
  defer: Defer | undefined,
  conversationId: string,
  event: ConversationServerEvent,
) {
  publish(defer, "conversation", conversationId, encodeRealtimeEvent(event));
}

export function publishWorkspaceEvent(
  defer: Defer | undefined,
  workspaceId: string,
  event: WorkspaceEvent,
) {
  publish(defer, "workspace", workspaceId, encodeRealtimeEvent(event));
}

/** Tells the widget and the inbox that a saved conversation changed. */
export function publishConversation(
  defer: Defer | undefined,
  workspaceId: string,
  row: ConversationRow,
  visitorMessageId: string | null = null,
) {
  publishConversationEvent(defer, row.id, {
    type: "conversation.updated",
    conversation: toWidgetConversation(row),
  });
  publishWorkspaceEvent(defer, workspaceId, {
    type: "conversation.updated",
    conversation: summarizeConversation(toConversation(row)),
    visitorMessageId,
  });
}
