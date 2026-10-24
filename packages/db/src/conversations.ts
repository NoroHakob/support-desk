import { nextState, type ConversationAction } from "@marshaldesk/shared";

import { db } from "./prisma/db";
import { isUniqueViolation } from "./errors";

const INBOX_LIMIT = 200;
const VISITOR_HISTORY_LIMIT = 3;

const conversationFields = [
  "id",
  "state",
  "handoffReason",
  "lastMessageAt",
  "lastVisitorMessageAt",
  "memberReadAt",
  "createdAt",
  "closedAt",
] as const;

const messageFields = [
  "id",
  "author",
  "memberId",
  "body",
  "systemEvent",
  "classification",
  "declined",
  "createdAt",
] as const;

const visitorFields = [
  "id",
  "country",
  "city",
  "timezone",
  "language",
  "device",
  "browser",
  "os",
  "page",
  "referrer",
  "visitCount",
  "firstSeenAt",
  "lastSeenAt",
] as const;

function conversations(workspaceId: string) {
  return db.orm.public.Conversation.select(...conversationFields)
    .where({ workspaceId })
    .include("visitor", (visitor) => visitor.select(...visitorFields));
}

function withMessages(workspaceId: string) {
  return conversations(workspaceId).include("messages", (message) =>
    message
      .select(...messageFields)
      .orderBy((item) => item.createdAt.asc())
      .include("member", (member) => member.select("name", "imageUrl")),
  );
}

export async function listInboxConversations(workspaceId: string) {
  return conversations(workspaceId)
    .include("messages", (message) =>
      message
        .select(...messageFields)
        .where((item) => item.author.neq("system"))
        .orderBy((item) => item.createdAt.desc())
        .limit(1),
    )
    .orderBy((conversation) => conversation.lastMessageAt.desc())
    .limit(INBOX_LIMIT)
    .all();
}

export async function findConversation(
  workspaceId: string,
  conversationId: string,
) {
  return withMessages(workspaceId).where({ id: conversationId }).first();
}

/** The visitor's latest conversations, oldest first. */
export async function listVisitorConversations(
  workspaceId: string,
  visitorId: string,
) {
  const rows = await withMessages(workspaceId)
    .where({ visitorId })
    .orderBy((conversation) => conversation.createdAt.desc())
    .limit(VISITOR_HISTORY_LIMIT)
    .all();
  return rows.toReversed();
}

export async function findOpenConversationId(
  workspaceId: string,
  visitorId: string,
) {
  const open = await db.orm.public.Conversation.select("id")
    .where({ workspaceId, visitorId })
    .where((conversation) => conversation.state.neq("closed"))
    .first();
  return open?.id ?? null;
}

// Messages written together get timestamps a millisecond apart, so they keep
// their order when sorted by `created_at`.
function at(base: Date, offset: number) {
  return new Date(base.getTime() + offset);
}

async function addVisitorMessageOnce({
  workspaceId,
  visitorId,
  body,
  greeting,
  agentOn,
  now,
}: {
  workspaceId: string;
  visitorId: string;
  body: string;
  greeting: string;
  agentOn: boolean;
  now: Date;
}) {
  return db.transaction(async (tx) => {
    const open = await tx.orm.public.Conversation.select("id")
      .where({ workspaceId, visitorId })
      .where((conversation) => conversation.state.neq("closed"))
      .forNoKeyUpdate()
      .first();

    if (open) {
      const message = await tx.orm.public.Message.select("id").create({
        conversationId: open.id,
        workspaceId,
        author: "visitor",
        body,
        createdAt: now,
      });
      await tx.orm.public.Conversation.where({ id: open.id, workspaceId })
        .select("id")
        .update({ lastMessageAt: now, lastVisitorMessageAt: now });
      return { conversationId: open.id, messageId: message.id };
    }

    // A new conversation opens with the greeting (PRD W-4). While the agent is
    // off it starts waiting for a person (PRD Flow C, "Agent off").
    const visitorAt = at(now, 1);
    const lastAt = agentOn ? visitorAt : at(now, 2);
    const conversation = await tx.orm.public.Conversation.select("id").create({
      workspaceId,
      visitorId,
      state: agentOn ? "ai" : "waiting",
      handoffReason: agentOn ? null : "agent_off",
      lastMessageAt: lastAt,
      lastVisitorMessageAt: visitorAt,
    });
    await tx.orm.public.Message.create({
      conversationId: conversation.id,
      workspaceId,
      author: "system",
      systemEvent: "greeting",
      body: greeting,
      createdAt: now,
    });
    const message = await tx.orm.public.Message.select("id").create({
      conversationId: conversation.id,
      workspaceId,
      author: "visitor",
      body,
      createdAt: visitorAt,
    });
    if (!agentOn) {
      await tx.orm.public.Message.create({
        conversationId: conversation.id,
        workspaceId,
        author: "system",
        systemEvent: "handoff",
        createdAt: lastAt,
      });
    }
    return { conversationId: conversation.id, messageId: message.id };
  });
}

/** Saves a visitor message, opening a conversation when none is open. */
export async function addVisitorMessage(
  input: Parameters<typeof addVisitorMessageOnce>[0],
) {
  try {
    return await addVisitorMessageOnce(input);
  } catch (error) {
    // Two first messages raced; the other one opened the conversation.
    if (isUniqueViolation(error)) {
      return addVisitorMessageOnce(input);
    }
    throw error;
  }
}

/** The visitor's conversation with that id, or their latest one. */
export async function findVisitorConversationId(
  workspaceId: string,
  visitorId: string,
  conversationId: string | null,
) {
  const row = conversationId
    ? await db.orm.public.Conversation.select("id")
        .where({ id: conversationId, workspaceId, visitorId })
        .first()
    : await db.orm.public.Conversation.select("id")
        .where({ workspaceId, visitorId })
        .orderBy((conversation) => conversation.createdAt.desc())
        .first();
  return row?.id ?? null;
}

export async function conversationExists(
  workspaceId: string,
  conversationId: string,
) {
  const row = await db.orm.public.Conversation.select("id")
    .where({ id: conversationId, workspaceId })
    .first();
  return Boolean(row);
}

export type TransitionResult =
  { ok: true } | { ok: false; reason: "not_found" | "conflict" };

/**
 * Applies a Flow C action under a row lock, so two actions on one conversation
 * can't both pass the state check. `memberId` is set for owner actions; a
 * reply also needs `body`.
 */
export async function applyConversationAction({
  workspaceId,
  conversationId,
  action,
  memberId,
  body,
  now,
}: {
  workspaceId: string;
  conversationId: string;
  action: ConversationAction;
  memberId: string | null;
  body: string | null;
  now: Date;
}): Promise<TransitionResult> {
  return db.transaction(async (tx) => {
    const current = await tx.orm.public.Conversation.select(
      "id",
      "state",
      "handoffReason",
    )
      .where({ id: conversationId, workspaceId })
      .forNoKeyUpdate()
      .first();
    if (!current) {
      return { ok: false, reason: "not_found" };
    }
    const transition = nextState(current.state, action);
    if (!transition) {
      return { ok: false, reason: "conflict" };
    }

    let lastAt = now;
    if (transition.systemEvent) {
      await tx.orm.public.Message.create({
        conversationId,
        workspaceId,
        author: "system",
        systemEvent: transition.systemEvent,
        createdAt: lastAt,
      });
    }
    if (body !== null) {
      lastAt = transition.systemEvent ? at(now, 1) : now;
      await tx.orm.public.Message.create({
        conversationId,
        workspaceId,
        author: "member",
        memberId,
        body,
        createdAt: lastAt,
      });
    }

    await tx.orm.public.Conversation.where({ id: conversationId, workspaceId })
      .select("id")
      .update({
        state: transition.state,
        handoffReason: transition.handoffReason ?? current.handoffReason,
        lastMessageAt: lastAt,
        ...(transition.state === "closed" ? { closedAt: now } : {}),
        ...(memberId ? { memberReadAt: lastAt } : {}),
      });
    return { ok: true };
  });
}

export async function markConversationRead(
  workspaceId: string,
  conversationId: string,
  now: Date,
) {
  return db.orm.public.Conversation.where({ id: conversationId, workspaceId })
    .select("id")
    .update({ memberReadAt: now });
}

/** Open conversations in every workspace with no messages since `before`. */
export async function listIdleConversations(before: Date) {
  return db.orm.public.Conversation.select("id", "workspaceId")
    .where((conversation) => conversation.state.neq("closed"))
    .where((conversation) => conversation.lastMessageAt.lt(before))
    .limit(100)
    .all();
}
