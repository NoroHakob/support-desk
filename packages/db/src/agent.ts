import type {
  AgentOutcome,
  Classification,
  HandoffReason,
  RetrievedChunk,
} from "@marshaldesk/shared";

import { at } from "./conversations";
import { db } from "./prisma/db";

/**
 * The visitor message an agent turn answers, with the messages before it.
 * Null when the message isn't a visitor message of that conversation.
 */
export async function loadAgentTurnContext({
  workspaceId,
  conversationId,
  messageId,
  historyLimit,
}: {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  historyLimit: number;
}) {
  const message = await db.orm.public.Message.select("id", "body", "createdAt")
    .where({ id: messageId, conversationId, workspaceId, author: "visitor" })
    .first();
  if (!message) return null;
  const history = await db.orm.public.Message.select("author", "body")
    .where({ conversationId, workspaceId })
    .where((item) => item.author.in(["visitor", "agent", "member"]))
    .where((item) => item.createdAt.lt(message.createdAt))
    .orderBy((item) => item.createdAt.desc())
    .limit(historyLimit)
    .all();
  return { message, history: history.toReversed() };
}

/**
 * Whether the agent may still write: the conversation is `ai` and the visitor
 * message it answers is still the newest (TECH-STACK section 8).
 */
export async function isAgentTurnCurrent(
  workspaceId: string,
  conversationId: string,
  messageCreatedAt: Date,
) {
  const row = await db.orm.public.Conversation.select("state", "lastMessageAt")
    .where({ id: conversationId, workspaceId })
    .first();
  return (
    row?.state === "ai" &&
    row.lastMessageAt.getTime() === messageCreatedAt.getTime()
  );
}

/**
 * The workspace's chunks closest to a unit-length query vector, best first.
 * The workspace filter is applied before ranking; there's no vector index, so
 * only this workspace's chunks are ever scored.
 */
export async function searchChunks(
  workspaceId: string,
  vector: number[],
  limit: number,
) {
  const plan = db.sql.public.chunks
    .select("id", "source_id")
    .select("score", (f, fns) => fns.cosineSimilarity(f.embedding, vector))
    .select("content", (f) => f.content)
    .where((f, fns) => fns.eq(f.workspace_id, workspaceId))
    .orderBy((f, fns) => fns.cosineDistance(f.embedding, vector), {
      direction: "asc",
    })
    .limit(limit)
    .build();
  const rows = await db.query(plan);
  if (rows.length === 0) return [];

  const sourceIds = [...new Set(rows.map((row) => row.source_id))];
  const sources = await db.orm.public.Source.select("id", "name")
    .where({ workspaceId })
    .where((source) => source.id.in(sourceIds))
    .all();
  const names = new Map(sources.map((source) => [source.id, source.name]));
  return rows.map((row) => ({
    chunkId: row.id,
    sourceId: row.source_id,
    sourceName: names.get(row.source_id) ?? "Deleted source",
    score: row.score,
    content: row.content,
  }));
}

export type AgentTurnLog = {
  chunks: RetrievedChunk[];
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  error: string | null;
};

/**
 * Saves the end of an agent turn under a row lock: the reply (with the id it
 * was streamed under), the handoff, and the `agent_turns` row. If the turn is
 * no longer current, or the caller passes `outcome: "discarded"`, only the
 * classification and a `discarded` log are saved. Returns whether the turn's
 * writes went through.
 */
export async function saveAgentTurn({
  workspaceId,
  conversationId,
  messageId,
  messageCreatedAt,
  classification,
  outcome,
  reply,
  handoffReason,
  log,
  now,
}: {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  messageCreatedAt: Date;
  classification: Classification | null;
  outcome: AgentOutcome;
  reply: { id: string; body: string } | null;
  handoffReason: HandoffReason | null;
  log: AgentTurnLog;
  now: Date;
}) {
  return db.transaction(async (tx) => {
    const conversation = await tx.orm.public.Conversation.select(
      "state",
      "lastMessageAt",
    )
      .where({ id: conversationId, workspaceId })
      .forNoKeyUpdate()
      .first();
    const current =
      outcome !== "discarded" &&
      conversation?.state === "ai" &&
      conversation.lastMessageAt.getTime() === messageCreatedAt.getTime();

    if (classification) {
      await tx.orm.public.Message.where({ id: messageId, workspaceId })
        .select("id")
        .update({ classification, declined: outcome === "declined" });
    }

    let lastAt = now;
    if (current && reply) {
      await tx.orm.public.Message.create({
        id: reply.id,
        conversationId,
        workspaceId,
        author: "agent",
        body: reply.body,
        createdAt: lastAt,
      });
    }
    if (current && handoffReason) {
      lastAt = reply ? at(now, 1) : now;
      await tx.orm.public.Message.create({
        conversationId,
        workspaceId,
        author: "system",
        systemEvent: "handoff",
        createdAt: lastAt,
      });
    }
    if (current && (reply || handoffReason)) {
      await tx.orm.public.Conversation.where({
        id: conversationId,
        workspaceId,
      })
        .select("id")
        .update({
          lastMessageAt: lastAt,
          ...(handoffReason ? { state: "waiting", handoffReason } : {}),
        });
    }

    await tx.orm.public.AgentTurn.create({
      workspaceId,
      messageId,
      replyMessageId: current ? (reply?.id ?? null) : null,
      outcome: current ? outcome : "discarded",
      chunks: log.chunks,
      model: log.model,
      tokensIn: log.tokensIn,
      tokensOut: log.tokensOut,
      latencyMs: log.latencyMs,
      error: log.error,
    });
    return current;
  });
}
