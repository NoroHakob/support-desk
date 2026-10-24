import {
  toConversation,
  toWidgetConversation,
  type findConversation,
} from "@marshaldesk/db";
import {
  encodeRealtimeEvent,
  sendRealtimeEvent,
  summarizeConversation,
  type ConversationServerEvent,
  type RealtimeParty,
  type WorkspaceEvent,
} from "@marshaldesk/shared";

type ConversationRow = NonNullable<
  Awaited<ReturnType<typeof findConversation>>
>;

/** Next's `after()`, passed in by the route handlers through the context. */
export type Defer = (task: () => Promise<void>) => void;

let warnedMissingConfig = false;

// Runs after the response is sent.
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
  (defer ?? ((task) => void task()))(() =>
    sendRealtimeEvent({ baseUrl, secret, party, room, body }),
  );
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
