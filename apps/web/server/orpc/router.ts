import {
  createWorkspaceWithOwner,
  findWorkspaceByUserId,
} from "@marshaldesk/db";

import { os, sessionProcedure } from "@/server/orpc/base";
import { inbox } from "@/server/orpc/inbox";
import { knowledge } from "@/server/orpc/knowledge";
import { realtime } from "@/server/orpc/realtime";
import { widget } from "@/server/orpc/widget";
import { widgetSettings } from "@/server/orpc/widget-settings";

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
  widgetSettings,
  knowledge,
  widget,
  realtime,
  inbox,
});

export type Router = typeof router;
