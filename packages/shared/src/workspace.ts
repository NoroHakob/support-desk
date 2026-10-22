import * as z from "zod";

export const WORKSPACE_NAME_MAX_LENGTH = 80;

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your business name.")
  .max(
    WORKSPACE_NAME_MAX_LENGTH,
    `Use at most ${WORKSPACE_NAME_MAX_LENGTH} characters.`,
  );

export const createWorkspaceInputSchema = z.object({
  name: workspaceNameSchema,
});

export const workspaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
