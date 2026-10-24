import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import * as z from "zod";

import {
  conversationSchema,
  conversationSummarySchema,
  replyInputSchema,
} from "./conversation";
import {
  realtimeTokenInputSchema,
  realtimeTokenSchema,
  widgetRealtimeTokenInputSchema,
  widgetRealtimeTokenSchema,
} from "./realtime";
import { sourceSchema } from "./source";
import {
  avatarUploadSchema,
  confirmAvatarUploadInputSchema,
  createAvatarUploadInputSchema,
  widgetSettingsInputSchema,
  widgetSettingsSchema,
} from "./widget";
import {
  visitorMessageInputSchema,
  widgetConfigInputSchema,
  widgetConfigSchema,
  widgetConversationSchema,
  widgetStartInputSchema,
  widgetStartSchema,
} from "./widget-chat";
import { createWorkspaceInputSchema, workspaceSchema } from "./workspace";

const conversationIdInputSchema = z.object({ id: z.uuid() });

const conversationErrors = {
  NOT_FOUND: { message: "We couldn't find that conversation." },
  CONFLICT: {
    message: "This conversation changed in the meantime. Refresh to see it.",
  },
} as const;

export const contract = {
  workspace: {
    current: oc
      .meta(
        openapi({
          method: "GET",
          path: "/workspace",
          summary: "Get the signed-in owner's workspace",
          tags: ["Workspace"],
        }),
      )
      .output(workspaceSchema.nullable()),
    create: oc
      .meta(
        openapi({
          method: "POST",
          path: "/workspace",
          summary: "Create the signed-in owner's workspace",
          tags: ["Workspace"],
        }),
      )
      .errors({
        CONFLICT: { message: "You already have a workspace." },
      })
      .input(createWorkspaceInputSchema)
      .output(workspaceSchema),
  },
  widgetSettings: {
    get: oc
      .meta(
        openapi({
          method: "GET",
          path: "/widget-settings",
          summary: "Get the workspace's widget settings",
          tags: ["Widget settings"],
        }),
      )
      .output(widgetSettingsSchema),
    update: oc
      .meta(
        openapi({
          method: "PUT",
          path: "/widget-settings",
          summary: "Save the workspace's widget settings",
          tags: ["Widget settings"],
        }),
      )
      .input(widgetSettingsInputSchema)
      .output(widgetSettingsSchema),
    createAvatarUpload: oc
      .meta(
        openapi({
          method: "POST",
          path: "/widget-settings/agent-avatar/upload",
          summary: "Get a presigned URL to upload the agent avatar",
          tags: ["Widget settings"],
        }),
      )
      .input(createAvatarUploadInputSchema)
      .output(avatarUploadSchema),
    confirmAvatarUpload: oc
      .meta(
        openapi({
          method: "POST",
          path: "/widget-settings/agent-avatar",
          summary: "Use an uploaded image as the agent avatar",
          tags: ["Widget settings"],
        }),
      )
      .errors({
        BAD_REQUEST: { message: "That upload can't be used as an avatar." },
      })
      .input(confirmAvatarUploadInputSchema)
      .output(widgetSettingsSchema),
    removeAvatar: oc
      .meta(
        openapi({
          method: "DELETE",
          path: "/widget-settings/agent-avatar",
          summary: "Go back to the generated agent avatar",
          tags: ["Widget settings"],
        }),
      )
      .output(widgetSettingsSchema),
  },
  knowledge: {
    sources: oc
      .meta(
        openapi({
          method: "GET",
          path: "/knowledge/sources",
          summary: "List the knowledge base's sources",
          tags: ["Knowledge base"],
        }),
      )
      .output(z.array(sourceSchema)),
  },
  // Called from the widget and the embed script on customers' websites.
  widget: {
    config: oc
      .meta(
        openapi({
          method: "GET",
          path: "/widget/{workspaceId}/config",
          summary: "Get the widget's public settings for an allowed domain",
          tags: ["Widget"],
        }),
      )
      .errors({
        NOT_FOUND: { message: "This widget doesn't exist." },
        FORBIDDEN: { message: "The widget isn't allowed on this domain." },
      })
      .input(widgetConfigInputSchema)
      .output(widgetConfigSchema),
    start: oc
      .meta(
        openapi({
          method: "POST",
          path: "/widget/{workspaceId}/start",
          summary: "Start or resume a visitor session and get a visitor token",
          tags: ["Widget"],
        }),
      )
      .errors({
        NOT_FOUND: { message: "This widget doesn't exist." },
        FORBIDDEN: { message: "The widget isn't allowed on this domain." },
      })
      .input(widgetStartInputSchema)
      .output(widgetStartSchema),
    conversations: oc
      .meta(
        openapi({
          method: "GET",
          path: "/widget/conversations",
          summary: "List the visitor's recent conversations, oldest first",
          tags: ["Widget"],
        }),
      )
      .output(z.array(widgetConversationSchema)),
    sendMessage: oc
      .meta(
        openapi({
          method: "POST",
          path: "/widget/messages",
          summary: "Send a visitor message, starting a conversation if needed",
          tags: ["Widget"],
        }),
      )
      .input(visitorMessageInputSchema)
      .output(widgetConversationSchema),
    requestHuman: oc
      .meta(
        openapi({
          method: "POST",
          path: "/widget/request-human",
          summary: "Ask for a person in the visitor's open conversation",
          tags: ["Widget"],
        }),
      )
      .errors(conversationErrors)
      .output(widgetConversationSchema),
    getRealtimeToken: oc
      .meta(
        openapi({
          method: "POST",
          path: "/widget/realtime-token",
          summary: "Get a short-lived token to follow a conversation live",
          tags: ["Widget"],
        }),
      )
      .errors({ NOT_FOUND: conversationErrors.NOT_FOUND })
      .input(widgetRealtimeTokenInputSchema)
      .output(widgetRealtimeTokenSchema),
  },
  realtime: {
    getToken: oc
      .meta(
        openapi({
          method: "POST",
          path: "/realtime/token",
          summary:
            "Get a short-lived token to follow the inbox or a conversation live",
          tags: ["Real time"],
        }),
      )
      .errors({ NOT_FOUND: conversationErrors.NOT_FOUND })
      .input(realtimeTokenInputSchema)
      .output(realtimeTokenSchema),
  },
  inbox: {
    list: oc
      .meta(
        openapi({
          method: "GET",
          path: "/inbox/conversations",
          summary: "List the workspace's conversations, newest first",
          tags: ["Inbox"],
        }),
      )
      .output(z.array(conversationSummarySchema)),
    conversation: oc
      .meta(
        openapi({
          method: "GET",
          path: "/inbox/conversations/{id}",
          summary: "Get a conversation with its full history",
          tags: ["Inbox"],
        }),
      )
      .errors({ NOT_FOUND: conversationErrors.NOT_FOUND })
      .input(conversationIdInputSchema)
      .output(conversationSchema),
    reply: oc
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/conversations/{id}/reply",
          summary: "Reply to a conversation, taking it over if needed",
          tags: ["Inbox"],
        }),
      )
      .errors(conversationErrors)
      .input(conversationIdInputSchema.extend(replyInputSchema.shape))
      .output(conversationSchema),
    takeOver: oc
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/conversations/{id}/take-over",
          summary: "Take a conversation over from the agent",
          tags: ["Inbox"],
        }),
      )
      .errors(conversationErrors)
      .input(conversationIdInputSchema)
      .output(conversationSchema),
    handBack: oc
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/conversations/{id}/hand-back",
          summary: "Hand a conversation back to the agent",
          tags: ["Inbox"],
        }),
      )
      .errors(conversationErrors)
      .input(conversationIdInputSchema)
      .output(conversationSchema),
    close: oc
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/conversations/{id}/close",
          summary: "Close a conversation",
          tags: ["Inbox"],
        }),
      )
      .errors(conversationErrors)
      .input(conversationIdInputSchema)
      .output(conversationSchema),
    markRead: oc
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/conversations/{id}/read",
          summary: "Mark a conversation as read",
          tags: ["Inbox"],
        }),
      )
      .errors({ NOT_FOUND: conversationErrors.NOT_FOUND })
      .input(conversationIdInputSchema)
      .output(z.void()),
  },
};

export type Contract = typeof contract;
