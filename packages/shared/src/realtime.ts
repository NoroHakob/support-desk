// Shared by the web app and the real-time Worker (TECH-STACK section 7). The
// Worker imports this file on its own, so it only depends on zod and oRPC's
// serializer.

import { RPCJsonSerializer } from "@orpc/client";
import * as z from "zod";

import { conversationSummarySchema } from "./conversation";
import { sourceSchema } from "./source";
import { widgetConversationSchema } from "./widget-chat";

export const REALTIME_TOKEN_AUDIENCE = "realtime";
export const REALTIME_TOKEN_LIFETIME_SECONDS = 60;

export const realtimePartySchema = z.enum(["conversation", "workspace"]);

// Who is on the other end of a socket. Members are the workspace's owner.
export const realtimeRoleSchema = z.enum(["visitor", "member"]);

export const realtimeTokenClaimsSchema = z.object({
  sub: z.uuid(),
  role: realtimeRoleSchema,
  wid: z.uuid(),
  // Set for a conversation room, null for the workspace room.
  cid: z.uuid().nullable(),
});

export const realtimeTokenInputSchema = z.discriminatedUnion("party", [
  z.object({ party: z.literal("workspace") }),
  z.object({ party: z.literal("conversation"), conversationId: z.uuid() }),
]);

export const realtimeTokenSchema = z.object({ token: z.string() });

export const widgetRealtimeTokenInputSchema = z.object({
  // Defaults to the visitor's latest conversation.
  conversationId: z.uuid().optional(),
});

export const widgetRealtimeTokenSchema = z.object({
  token: z.string(),
  conversationId: z.uuid(),
});

// Published by the server to a conversation room. Visitors receive these, so
// they only carry what the widget may show.
export const conversationServerEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("conversation.updated"),
    conversation: widgetConversationSchema,
  }),
]);

export const typingEventSchema = z.object({
  type: z.literal("typing"),
  role: realtimeRoleSchema,
  typing: z.boolean(),
});

// Everything a conversation room delivers: server events plus typing, which
// the Worker relays between the visitor and the owner.
export const conversationEventSchema = z.discriminatedUnion("type", [
  ...conversationServerEventSchema.options,
  typingEventSchema,
]);

// The workspace room only reaches the owner.
export const workspaceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("conversation.updated"),
    conversation: conversationSummarySchema,
    // Set when the update is a new visitor message (PRD D-6).
    visitorMessageId: z.uuid().nullable(),
  }),
  z.object({
    type: z.literal("conversation.read"),
    conversationId: z.uuid(),
  }),
  z.object({ type: z.literal("source.updated"), source: sourceSchema }),
  z.object({ type: z.literal("source.deleted"), sourceId: z.uuid() }),
  z.object({
    type: z.literal("knowledge.updated"),
    suggestedQuestions: z.array(z.string()),
  }),
]);

// The only thing a client may send, and only in a conversation room. The
// Worker adds the role from the token.
export const clientEventSchema = z.object({
  type: z.literal("typing"),
  typing: z.boolean(),
});

export type RealtimeParty = z.infer<typeof realtimePartySchema>;
export type RealtimeRole = z.infer<typeof realtimeRoleSchema>;
export type RealtimeTokenClaims = z.infer<typeof realtimeTokenClaimsSchema>;
export type RealtimeTokenInput = z.infer<typeof realtimeTokenInputSchema>;
export type ConversationServerEvent = z.infer<
  typeof conversationServerEventSchema
>;
export type TypingEvent = z.infer<typeof typingEventSchema>;
export type ConversationEvent = z.infer<typeof conversationEventSchema>;
export type WorkspaceEvent = z.infer<typeof workspaceEventSchema>;
export type ClientEvent = z.infer<typeof clientEventSchema>;

const serializer = new RPCJsonSerializer();

const serializedSchema = z.object({
  json: z.unknown(),
  meta: z
    .array(z.tuple([z.string()], z.union([z.string(), z.number()])))
    .optional(),
});

// Events carry dates, so they travel in oRPC's JSON format, which restores them.
export function encodeRealtimeEvent(
  event: ConversationEvent | WorkspaceEvent,
): string {
  return JSON.stringify(serializer.serialize(event));
}

/** Returns null for anything that isn't a valid event for `schema`. */
export function decodeRealtimeEvent<Schema extends z.ZodType>(
  schema: Schema,
  text: string,
): z.infer<Schema> | null {
  try {
    const serialized = serializedSchema.safeParse(JSON.parse(text));
    if (!serialized.success) return null;
    const event = schema.safeParse(serializer.deserialize(serialized.data));
    return event.success ? event.data : null;
  } catch {
    return null;
  }
}

export function encodeClientEvent(event: ClientEvent): string {
  return JSON.stringify(event);
}

export function decodeClientEvent(text: string): ClientEvent | null {
  try {
    const event = clientEventSchema.safeParse(JSON.parse(text));
    return event.success ? event.data : null;
  } catch {
    return null;
  }
}
