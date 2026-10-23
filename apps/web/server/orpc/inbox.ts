import {
  applyConversationAction,
  findConversation,
  listInboxConversations,
  markConversationRead,
  type TransitionResult,
} from "@marshaldesk/db";
import { assertNever, type ConversationAction } from "@marshaldesk/shared";

import {
  toConversation,
  toConversationSummary,
} from "@/server/conversation-dto";
import { ownerProcedure } from "@/server/orpc/base";

type ConversationErrors = {
  NOT_FOUND: () => Error;
  CONFLICT: () => Error;
};

function throwIfFailed(result: TransitionResult, errors: ConversationErrors) {
  if (result.ok) return;
  switch (result.reason) {
    case "not_found":
      throw errors.NOT_FOUND();
    case "conflict":
      throw errors.CONFLICT();
    default:
      return assertNever(result.reason);
  }
}

async function act({
  workspaceId,
  memberId,
  conversationId,
  action,
  body,
  errors,
}: {
  workspaceId: string;
  memberId: string;
  conversationId: string;
  action: ConversationAction;
  body: string | null;
  errors: ConversationErrors;
}) {
  const result = await applyConversationAction({
    workspaceId,
    conversationId,
    action,
    memberId,
    body,
    now: new Date(),
  });
  throwIfFailed(result, errors);
  const row = await findConversation(workspaceId, conversationId);
  if (!row) {
    throw errors.NOT_FOUND();
  }
  return toConversation(row);
}

export const inbox = {
  list: ownerProcedure.inbox.list.handler(async ({ context }) => {
    const rows = await listInboxConversations(context.workspaceId);
    return rows.map(toConversationSummary);
  }),

  conversation: ownerProcedure.inbox.conversation.handler(
    async ({ context, input, errors }) => {
      const row = await findConversation(context.workspaceId, input.id);
      if (!row) {
        throw errors.NOT_FOUND();
      }
      return toConversation(row);
    },
  ),

  // Sending a reply is taking over (PRD Flow C).
  reply: ownerProcedure.inbox.reply.handler(({ context, input, errors }) =>
    act({
      ...context,
      conversationId: input.id,
      action: "reply",
      body: input.body,
      errors,
    }),
  ),

  takeOver: ownerProcedure.inbox.takeOver.handler(
    ({ context, input, errors }) =>
      act({
        ...context,
        conversationId: input.id,
        action: "take_over",
        body: null,
        errors,
      }),
  ),

  handBack: ownerProcedure.inbox.handBack.handler(
    ({ context, input, errors }) =>
      act({
        ...context,
        conversationId: input.id,
        action: "hand_back",
        body: null,
        errors,
      }),
  ),

  close: ownerProcedure.inbox.close.handler(({ context, input, errors }) =>
    act({
      ...context,
      conversationId: input.id,
      action: "close",
      body: null,
      errors,
    }),
  ),

  markRead: ownerProcedure.inbox.markRead.handler(
    async ({ context, input, errors }) => {
      const row = await markConversationRead(
        context.workspaceId,
        input.id,
        new Date(),
      );
      if (!row) {
        throw errors.NOT_FOUND();
      }
    },
  ),
};
