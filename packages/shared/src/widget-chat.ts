import * as z from "zod";

import {
  conversationStateSchema,
  MESSAGE_MAX_LENGTH,
  messageAuthorSchema,
  systemEventSchema,
} from "./conversation";
import { widgetColorSchema, widgetPositionSchema } from "./widget";

// A hostname as the embed script reports it: no scheme, no port.
export const widgetHostSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(253)
  .regex(/^[a-z0-9.-]+$/);

export const widgetConfigInputSchema = z.object({
  workspaceId: z.uuid(),
  host: widgetHostSchema,
});

// Everything here is public: it's what any page on an allowed domain can read.
export const widgetConfigSchema = z.object({
  position: widgetPositionSchema,
  color: widgetColorSchema,
  agentName: z.string(),
  agentAvatarUrl: z.string().nullable(),
  greeting: z.string(),
  suggestedQuestions: z.array(z.string()),
  agentOn: z.boolean(),
});

export const visitorContextSchema = z.object({
  timezone: z.string().max(64).nullable(),
  language: z.string().max(35).nullable(),
  page: z.string().max(2000).nullable(),
  referrer: z.string().max(2000).nullable(),
});

export const widgetStartInputSchema = z.object({
  workspaceId: z.uuid(),
  host: widgetHostSchema,
  token: z.string().max(4000).nullable(),
  visitor: visitorContextSchema,
});

export const widgetStartSchema = z.object({
  token: z.string(),
});

export const widgetMemberSchema = z.object({
  name: z.string(),
  imageUrl: z.string().nullable(),
});

// What the visitor may see of a message: no classification, agent turn or
// declined flag.
export const widgetMessageSchema = z.object({
  id: z.uuid(),
  author: messageAuthorSchema,
  body: z.string(),
  systemEvent: systemEventSchema.nullable(),
  member: widgetMemberSchema.nullable(),
  createdAt: z.date(),
});

export const widgetConversationSchema = z.object({
  id: z.uuid(),
  state: conversationStateSchema,
  createdAt: z.date(),
  closedAt: z.date().nullable(),
  messages: z.array(widgetMessageSchema),
});

export const visitorMessageInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a message.")
    .max(MESSAGE_MAX_LENGTH, `Use at most ${MESSAGE_MAX_LENGTH} characters.`),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export type VisitorContext = z.infer<typeof visitorContextSchema>;
export type WidgetStartInput = z.infer<typeof widgetStartInputSchema>;
export type WidgetMember = z.infer<typeof widgetMemberSchema>;
export type WidgetMessage = z.infer<typeof widgetMessageSchema>;
export type WidgetConversation = z.infer<typeof widgetConversationSchema>;
export type VisitorMessageInput = z.infer<typeof visitorMessageInputSchema>;
