import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";

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
};

export type Contract = typeof contract;
