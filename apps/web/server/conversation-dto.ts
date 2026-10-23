import type { findConversation, listInboxConversations } from "@marshaldesk/db";
import type {
  Conversation,
  ConversationSummary,
  Message,
  Visitor,
  WidgetConversation,
  WidgetMessage,
} from "@marshaldesk/shared";

type ConversationRow = NonNullable<
  Awaited<ReturnType<typeof findConversation>>
>;
type InboxRow = Awaited<ReturnType<typeof listInboxConversations>>[number];
type VisitorRow = NonNullable<ConversationRow["visitor"]>;
type MessageRow = Omit<ConversationRow["messages"][number], "member">;
type MessageWithMemberRow = ConversationRow["messages"][number];

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

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    author: row.author,
    memberId: row.memberId,
    body: row.body,
    // Attachments, agent turns and cited sources arrive in later phases.
    attachments: [],
    classification: row.classification,
    declined: row.declined,
    systemEvent: row.systemEvent,
    agentTurn: null,
    sources: [],
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
  return {
    id: row.id,
    state: row.state,
    handoffReason: row.handoffReason,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    unread: unread(row),
    visitor: toVisitor(row.visitor),
    messages: row.messages.map(toMessage),
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
