import type { findConversation, listInboxConversations } from "./conversations";
import {
  summarizeConversation,
  type AgentTurn,
  type Conversation,
  type ConversationServerEvent,
  type ConversationSummary,
  type Message,
  type MessageSource,
  type Visitor,
  type WidgetConversation,
  type WidgetMessage,
  type WorkspaceEvent,
} from "@marshaldesk/shared";

type ConversationRow = NonNullable<
  Awaited<ReturnType<typeof findConversation>>
>;
type InboxRow = Awaited<ReturnType<typeof listInboxConversations>>[number];
type VisitorRow = NonNullable<ConversationRow["visitor"]>;
type MessageWithMemberRow = ConversationRow["messages"][number];
type MessageRow = Omit<MessageWithMemberRow, "member" | "agentTurns"> &
  Partial<Pick<MessageWithMemberRow, "agentTurns">>;
type AgentTurnRow = MessageWithMemberRow["agentTurns"][number];

const FALLBACK_MEMBER_NAME = "Support team";

// The foreign key guarantees the visitor; the include is typed as optional.
function toVisitor(row: VisitorRow | null): Visitor {
  if (!row) {
    throw new Error("A conversation is missing its visitor.");
  }
  return {
    id: row.id,
    details: {
      country: row.country,
      city: row.city,
      timezone: row.timezone,
      language: row.language,
      device: row.device,
      browser: row.browser,
      os: row.os,
      page: row.page,
      referrer: row.referrer,
      visitCount: row.visitCount,
    },
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
  };
}

function toAgentTurn(row: AgentTurnRow): AgentTurn {
  return {
    id: row.id,
    outcome: row.outcome,
    chunks: [...row.chunks],
    model: row.model,
    tokensIn: row.tokensIn,
    tokensOut: row.tokensOut,
    latencyMs: row.latencyMs,
  };
}

// The sources each agent reply was answered from, by reply id.
function replySources(rows: readonly MessageRow[]) {
  const sources = new Map<string, MessageSource[]>();
  for (const turn of rows.flatMap((row) => row.agentTurns ?? [])) {
    if (!turn.replyMessageId || turn.outcome !== "answered") continue;
    const used = new Map(
      turn.chunks
        .filter((chunk) => chunk.used)
        .map((chunk) => [chunk.sourceId, chunk.sourceName]),
    );
    sources.set(
      turn.replyMessageId,
      [...used].map(([id, name]) => ({ id, name })),
    );
  }
  return sources;
}

function toMessage(
  row: MessageRow,
  sources: ReadonlyMap<string, MessageSource[]> = new Map(),
): Message {
  const [turn] = row.agentTurns ?? [];
  return {
    id: row.id,
    author: row.author,
    memberId: row.memberId,
    body: row.body,
    // Attachments arrive with AI-6.
    attachments: [],
    classification: row.classification,
    declined: row.declined,
    systemEvent: row.systemEvent,
    agentTurn: turn ? toAgentTurn(turn) : null,
    sources: sources.get(row.id) ?? [],
    createdAt: row.createdAt,
  };
}

function unread(row: {
  lastVisitorMessageAt: Date | null;
  memberReadAt: Date | null;
}) {
  return (
    row.lastVisitorMessageAt !== null &&
    (row.memberReadAt === null || row.lastVisitorMessageAt > row.memberReadAt)
  );
}

export function toConversation(row: ConversationRow): Conversation {
  const sources = replySources(row.messages);
  return {
    id: row.id,
    state: row.state,
    handoffReason: row.handoffReason,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    unread: unread(row),
    visitor: toVisitor(row.visitor),
    messages: row.messages.map((message) => toMessage(message, sources)),
  };
}

export function toConversationSummary(row: InboxRow): ConversationSummary {
  const [lastMessage] = row.messages;
  return {
    id: row.id,
    state: row.state,
    handoffReason: row.handoffReason,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    unread: unread(row),
    visitor: toVisitor(row.visitor),
    lastMessage: lastMessage ? toMessage(lastMessage) : null,
  };
}

function toWidgetMessage(row: MessageWithMemberRow): WidgetMessage {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    systemEvent: row.systemEvent,
    member:
      row.author === "member"
        ? {
            name: row.member?.name ?? FALLBACK_MEMBER_NAME,
            imageUrl: row.member?.imageUrl ?? null,
          }
        : null,
    createdAt: row.createdAt,
  };
}

export function toWidgetConversation(row: ConversationRow): WidgetConversation {
  return {
    id: row.id,
    state: row.state,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    messages: row.messages.map(toWidgetMessage),
  };
}

/**
 * What tells the widget (conversation room) and the inbox (workspace room)
 * that a saved conversation changed. `visitorMessageId` is set when the
 * change should notify the owner (PRD D-6).
 */
export function toConversationEvents(
  row: ConversationRow,
  visitorMessageId: string | null,
): [ConversationServerEvent, WorkspaceEvent] {
  return [
    { type: "conversation.updated", conversation: toWidgetConversation(row) },
    {
      type: "conversation.updated",
      conversation: summarizeConversation(toConversation(row)),
      visitorMessageId,
    },
  ];
}
