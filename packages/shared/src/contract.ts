import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { sourceSchema } from "./source";
import {
  avatarUploadSchema,
  confirmAvatarUploadInputSchema,
  createAvatarUploadInputSchema,
  widgetSettingsInputSchema,
  widgetSettingsSchema,
} from "./widget";
import { createWorkspaceInputSchema, workspaceSchema } from "./workspace";

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
};

export type Contract = typeof contract;
