import * as z from "zod";

export const MESSAGE_MAX_LENGTH = 4000;

export const conversationStateSchema = z.enum([
  "ai",
  "waiting",
  "human",
  "closed",
]);

export const handoffReasonSchema = z.enum([
  "low_confidence",
  "no_relevant_knowledge",
  "visitor_requested",
  "agent_off",
]);

export const messageAuthorSchema = z.enum([
  "visitor",
  "agent",
  "member",
  "system",
]);

export const classificationSchema = z.enum([
  "support_question",
  "small_talk",
  "off_topic",
  "human_request",
]);

// What a `system` message stands for, so the dashboard and widget can word it.
export const systemEventSchema = z.enum([
  "greeting",
  "handoff",
  "taken_over",
  "handed_back",
  "closed",
]);

export const agentOutcomeSchema = z.enum([
  "answered",
  "replied",
  "declined",
  "handed_off",
]);

export const attachmentSchema = z.object({
  url: z.string(),
  mime: z.string(),
  size: z.number().int(),
});

export const retrievedChunkSchema = z.object({
  chunkId: z.uuid(),
  sourceId: z.uuid(),
  sourceName: z.string(),
  score: z.number(),
  used: z.boolean(),
});

export const agentTurnSchema = z.object({
  id: z.uuid(),
  outcome: agentOutcomeSchema,
  chunks: z.array(retrievedChunkSchema),
  model: z.string(),
  tokensIn: z.number().int(),
  tokensOut: z.number().int(),
  latencyMs: z.number().int(),
});

export const messageSourceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const messageSchema = z.object({
  id: z.uuid(),
  author: messageAuthorSchema,
  memberId: z.uuid().nullable(),
  body: z.string(),
  attachments: z.array(attachmentSchema),
  classification: classificationSchema.nullable(),
  declined: z.boolean(),
  systemEvent: systemEventSchema.nullable(),
  // Set on visitor messages the agent handled.
  agentTurn: agentTurnSchema.nullable(),
  // Set on agent replies: the sources of the chunks the answer used.
  sources: z.array(messageSourceSchema),
  createdAt: z.date(),
});

export const visitorDetailsSchema = z.object({
  country: z.string().nullable(),
  city: z.string().nullable(),
  timezone: z.string().nullable(),
  language: z.string().nullable(),
  device: z.enum(["desktop", "mobile", "tablet"]).nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  page: z.string().nullable(),
  referrer: z.string().nullable(),
  visitCount: z.number().int(),
});

export const visitorSchema = z.object({
  id: z.uuid(),
  details: visitorDetailsSchema,
  firstSeenAt: z.date(),
  lastSeenAt: z.date(),
});

export const conversationSchema = z.object({
  id: z.uuid(),
  state: conversationStateSchema,
  handoffReason: handoffReasonSchema.nullable(),
  lastMessageAt: z.date(),
  createdAt: z.date(),
  closedAt: z.date().nullable(),
  unread: z.boolean(),
  visitor: visitorSchema,
  messages: z.array(messageSchema),
});

export const replyInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a reply.")
    .max(MESSAGE_MAX_LENGTH, `Use at most ${MESSAGE_MAX_LENGTH} characters.`),
});

export type ConversationState = z.infer<typeof conversationStateSchema>;
export type HandoffReason = z.infer<typeof handoffReasonSchema>;
export type MessageAuthor = z.infer<typeof messageAuthorSchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type SystemEvent = z.infer<typeof systemEventSchema>;
export type AgentOutcome = z.infer<typeof agentOutcomeSchema>;
export type RetrievedChunk = z.infer<typeof retrievedChunkSchema>;
export type AgentTurn = z.infer<typeof agentTurnSchema>;
export type Message = z.infer<typeof messageSchema>;
export type VisitorDetails = z.infer<typeof visitorDetailsSchema>;
export type Visitor = z.infer<typeof visitorSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ReplyInput = z.infer<typeof replyInputSchema>;
