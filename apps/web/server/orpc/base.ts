import {
  findMembershipByUserId,
  findVisitor,
  findWidgetSettings,
  updateMemberProfile,
} from "@marshaldesk/db";
import { contract } from "@marshaldesk/shared";
import { implement, ORPCError } from "@orpc/server";

import { auth } from "@/lib/auth/server";
import { displayName } from "@/lib/user";
import { isAllowedHost } from "@/server/widget/hosts";
import {
  verifyVisitorToken,
  visitorSecretMatches,
} from "@/server/widget/visitor-token";

// The HTTP handlers pass the request headers; the in-process server client
// (used for SSR prefetching) has none.
export const os = implement(contract).$context<{ headers?: Headers }>();

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
    // Visitors see the owner's name and photo, so keep the copy current.
    const name = displayName(context.user);
    const imageUrl = context.user.image ?? null;
    if (membership.name !== name || membership.imageUrl !== imageUrl) {
      await updateMemberProfile(membership.id, { name, imageUrl });
    }
    return next({
      context: {
        memberId: membership.id,
        workspaceId: membership.workspaceId,
      },
    });
  },
);

export const visitorProcedure = os.use(async ({ context, next }) => {
  const authorization = context.headers?.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const claims = token ? await verifyVisitorToken(token) : null;
  if (!claims) {
    throw new ORPCError("UNAUTHORIZED");
  }
  const [visitor, settings] = await Promise.all([
    findVisitor(claims.wid, claims.sub),
    findWidgetSettings(claims.wid),
  ]);
  if (
    !visitor ||
    !settings ||
    !visitorSecretMatches(claims.vsk, visitor.tokenSecretHash)
  ) {
    throw new ORPCError("UNAUTHORIZED");
  }
  // Removing a domain cuts off the tokens already issued for it.
  if (!isAllowedHost(claims.host, settings.allowedDomains)) {
    throw new ORPCError("FORBIDDEN", {
      message: "The widget isn't allowed on this domain.",
    });
  }
  return next({
    context: {
      visitorId: visitor.id,
      workspaceId: claims.wid,
      widgetSettings: settings,
    },
  });
});
