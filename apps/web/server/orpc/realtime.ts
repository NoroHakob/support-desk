import { conversationExists } from "@marshaldesk/db";
import { assertNever } from "@marshaldesk/shared";

import { ownerProcedure } from "@/server/orpc/base";
import { signRealtimeToken } from "@/server/realtime/token";

export const realtime = {
  getToken: ownerProcedure.realtime.getToken.handler(
    async ({ context, input, errors }) => {
      const claims = {
        sub: context.memberId,
        role: "member" as const,
        wid: context.workspaceId,
      };
      switch (input.party) {
        case "workspace":
          return { token: await signRealtimeToken({ ...claims, cid: null }) };
        case "conversation":
          if (
            !(await conversationExists(
              context.workspaceId,
              input.conversationId,
            ))
          ) {
            throw errors.NOT_FOUND();
          }
          return {
            token: await signRealtimeToken({
              ...claims,
              cid: input.conversationId,
            }),
          };
        default:
          return assertNever(input);
      }
    },
  ),
};
