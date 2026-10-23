import { listSources } from "@marshaldesk/db";

import { ownerProcedure } from "@/server/orpc/base";

export const knowledge = {
  sources: ownerProcedure.knowledge.sources.handler(({ context }) =>
    listSources(context.workspaceId),
  ),
};
