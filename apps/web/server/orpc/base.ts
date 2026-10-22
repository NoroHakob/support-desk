import { contract } from "@marshaldesk/shared";
import { findMembershipByUserId } from "@marshaldesk/db";
import { implement, ORPCError } from "@orpc/server";

import { auth } from "@/lib/auth/server";

export const os = implement(contract);

export const sessionProcedure = os.use(async ({ next }) => {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  if (!session.user.emailVerified) {
    throw new ORPCError("FORBIDDEN", { message: "Verify your email first." });
  }
  return next({ context: { user: session.user } });
});

export const ownerProcedure = sessionProcedure.use(
  async ({ context, next }) => {
    const membership = await findMembershipByUserId(context.user.id);
    if (!membership) {
      throw new ORPCError("FORBIDDEN", {
        message: "Create your workspace first.",
      });
    }
    return next({
      context: {
        memberId: membership.id,
        workspaceId: membership.workspaceId,
      },
    });
  },
);
