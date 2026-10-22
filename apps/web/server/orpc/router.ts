import {
  createWorkspaceWithOwner,
  findWorkspaceByUserId,
} from "@marshaldesk/db";

import { os, sessionProcedure } from "@/server/orpc/base";

export const router = os.router({
  workspace: {
    current: sessionProcedure.workspace.current.handler(({ context }) =>
      findWorkspaceByUserId(context.user.id),
    ),
    create: sessionProcedure.workspace.create.handler(
      async ({ context, input, errors }) => {
        const workspace = await createWorkspaceWithOwner({
          userId: context.user.id,
          name: input.name,
        });
        if (!workspace) {
          throw errors.CONFLICT();
        }
        return workspace;
      },
    ),
  },
});

export type Router = typeof router;
