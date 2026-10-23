import {
  addVisitorMessage,
  applyConversationAction,
  createVisitor,
  findConversation,
  findOpenConversationId,
  findVisitor,
  findWidgetSettings,
  hasReadySource,
  listVisitorConversations,
  markSnippetInstalled,
  recordVisit,
} from "@marshaldesk/db";
import { assertNever } from "@marshaldesk/shared";
import { ORPCError } from "@orpc/server";

import { toWidgetConversation } from "@/server/conversation-dto";
import { os, visitorProcedure } from "@/server/orpc/base";
import { toWidgetSettings } from "@/server/orpc/widget-settings";
import { isAllowedHost, isDevelopmentHost } from "@/server/widget/hosts";
import { visitorDetails } from "@/server/widget/visitor-details";
import {
  hashVisitorSecret,
  needsReissue,
  newVisitorSecret,
  signVisitorToken,
  verifyVisitorToken,
  visitorSecretMatches,
} from "@/server/widget/visitor-token";

const NEW_VISIT_AFTER_MS = 30 * 60 * 1000;

async function loadConversation(workspaceId: string, conversationId: string) {
  const row = await findConversation(workspaceId, conversationId);
  if (!row) {
    throw new ORPCError("NOT_FOUND");
  }
  return toWidgetConversation(row);
}

export const widget = {
  config: os.widget.config.handler(async ({ input, errors }) => {
    const row = await findWidgetSettings(input.workspaceId);
    if (!row) {
      throw errors.NOT_FOUND();
    }
    if (!isAllowedHost(input.host, row.allowedDomains)) {
      throw errors.FORBIDDEN();
    }
    const settings = toWidgetSettings(row);
    return {
      position: settings.position,
      color: settings.color,
      agentName: settings.agentName,
      agentAvatarUrl: settings.agentAvatarUrl,
      greeting: settings.greeting,
      suggestedQuestions: settings.suggestedQuestions,
      agentOn: await hasReadySource(input.workspaceId),
    };
  }),

  // The host is reported by the page, so a script outside a browser could
  // claim an allowed domain. The frame-ancestors policy is what keeps the
  // widget off other sites (TECH-STACK section 6).
  start: os.widget.start.handler(async ({ context, input, errors }) => {
    const { workspaceId, host } = input;
    const settings = await findWidgetSettings(workspaceId);
    if (!settings) {
      throw errors.NOT_FOUND();
    }
    if (!isAllowedHost(host, settings.allowedDomains)) {
      throw errors.FORBIDDEN();
    }

    const now = new Date();
    const details = visitorDetails(
      context.headers ?? new Headers(),
      input.visitor,
    );
    const claims = input.token ? await verifyVisitorToken(input.token) : null;
    const existing =
      claims?.wid === workspaceId
        ? await findVisitor(workspaceId, claims.sub)
        : null;

    let token: string;
    if (
      claims &&
      input.token &&
      existing &&
      visitorSecretMatches(claims.vsk, existing.tokenSecretHash)
    ) {
      const newVisit =
        now.getTime() - existing.lastSeenAt.getTime() > NEW_VISIT_AFTER_MS;
      await recordVisit({
        workspaceId,
        visitorId: existing.id,
        details,
        visitCount: existing.visitCount + (newVisit ? 1 : 0),
        now,
      });
      token = needsReissue(claims, host)
        ? await signVisitorToken({
            visitorId: existing.id,
            workspaceId,
            host,
            secret: claims.vsk,
          })
        : input.token;
    } else {
      const secret = newVisitorSecret();
      const visitor = await createVisitor({
        workspaceId,
        tokenSecretHash: hashVisitorSecret(secret),
        details,
        now,
      });
      token = await signVisitorToken({
        visitorId: visitor.id,
        workspaceId,
        host,
        secret,
      });
    }

    if (!isDevelopmentHost(host)) {
      await markSnippetInstalled(workspaceId, now);
    }
    return { token };
  }),

  conversations: visitorProcedure.widget.conversations.handler(
    async ({ context }) => {
      const rows = await listVisitorConversations(
        context.workspaceId,
        context.visitorId,
      );
      return rows.map(toWidgetConversation);
    },
  ),

  // No agent runs yet: a message in the `ai` state waits for the owner.
  sendMessage: visitorProcedure.widget.sendMessage.handler(
    async ({ context, input }) => {
      const conversationId = await addVisitorMessage({
        workspaceId: context.workspaceId,
        visitorId: context.visitorId,
        body: input.body,
        greeting: context.widgetSettings.greeting,
        agentOn: await hasReadySource(context.workspaceId),
        now: new Date(),
      });
      return loadConversation(context.workspaceId, conversationId);
    },
  ),

  requestHuman: visitorProcedure.widget.requestHuman.handler(
    async ({ context, errors }) => {
      const conversationId = await findOpenConversationId(
        context.workspaceId,
        context.visitorId,
      );
      if (!conversationId) {
        throw errors.NOT_FOUND();
      }
      const result = await applyConversationAction({
        workspaceId: context.workspaceId,
        conversationId,
        action: "request_human",
        memberId: null,
        body: null,
        now: new Date(),
      });
      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw errors.NOT_FOUND();
          case "conflict":
            throw errors.CONFLICT();
          default:
            return assertNever(result.reason);
        }
      }
      return loadConversation(context.workspaceId, conversationId);
    },
  ),
};
