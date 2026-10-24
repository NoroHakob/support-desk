import {
  findConversation,
  findSource,
  toConversation,
  toWidgetConversation,
} from "@marshaldesk/db";
import {
  encodeRealtimeEvent,
  sendRealtimeEvent,
  summarizeConversation,
  type ConversationServerEvent,
  type RealtimeParty,
  type WorkspaceEvent,
} from "@marshaldesk/shared";

import { requireEnv } from "./env";

function publish(party: RealtimeParty, room: string, body: string) {
  return sendRealtimeEvent({
    baseUrl: requireEnv("REALTIME_URL"),
    secret: requireEnv("REALTIME_PUBLISH_SECRET"),
    party,
    room,
    body,
  });
}

function publishWorkspaceEvent(workspaceId: string, event: WorkspaceEvent) {
  return publish("workspace", workspaceId, encodeRealtimeEvent(event));
}

function publishConversationEvent(
  conversationId: string,
  event: ConversationServerEvent,
) {
  return publish("conversation", conversationId, encodeRealtimeEvent(event));
}

/** Tells the dashboard a source's status changed. */
export async function publishSource(workspaceId: string, sourceId: string) {
  const source = await findSource(workspaceId, sourceId);
  if (source) {
    await publishWorkspaceEvent(workspaceId, {
      type: "source.updated",
      source,
    });
  }
}

export function publishSuggestedQuestions(
  workspaceId: string,
  suggestedQuestions: string[],
) {
  return publishWorkspaceEvent(workspaceId, {
    type: "knowledge.updated",
    suggestedQuestions,
  });
}

/** Tells the widget and the inbox that a saved conversation changed. */
export async function publishConversation(
  workspaceId: string,
  conversationId: string,
) {
  const row = await findConversation(workspaceId, conversationId);
  if (!row) return;
  await Promise.all([
    publishConversationEvent(row.id, {
      type: "conversation.updated",
      conversation: toWidgetConversation(row),
    }),
    publishWorkspaceEvent(workspaceId, {
      type: "conversation.updated",
      conversation: summarizeConversation(toConversation(row)),
      visitorMessageId: null,
    }),
  ]);
}
