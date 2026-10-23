"use client";

import {
  assertNever,
  type Conversation,
  type Message,
  type SystemEvent,
} from "@marshaldesk/shared";
import { useState } from "react";

// Mock stand-in for the inbox procedures: applies Flow C transitions to local
// state only, so everything resets on reload.

type Stamp = { at: Date; ids: [string, string] };

function newStamp(): Stamp {
  return { at: new Date(), ids: [crypto.randomUUID(), crypto.randomUUID()] };
}

function blankMessage(id: string, at: Date): Message {
  return {
    id,
    author: "system",
    memberId: null,
    body: "",
    attachments: [],
    classification: null,
    declined: false,
    systemEvent: null,
    agentTurn: null,
    sources: [],
    createdAt: at,
  };
}

function systemMessage(event: SystemEvent, stamp: Stamp): Message {
  return { ...blankMessage(stamp.ids[0], stamp.at), systemEvent: event };
}

function memberMessage(body: string, stamp: Stamp): Message {
  return { ...blankMessage(stamp.ids[1], stamp.at), author: "member", body };
}

function append(conversation: Conversation, message: Message): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    lastMessageAt: message.createdAt,
  };
}

function takeOver(conversation: Conversation, stamp: Stamp): Conversation {
  switch (conversation.state) {
    case "ai":
    case "waiting":
      return {
        ...append(conversation, systemMessage("taken_over", stamp)),
        state: "human",
      };
    case "human":
    case "closed":
      return conversation;
    default:
      return assertNever(conversation.state);
  }
}

function handBack(conversation: Conversation, stamp: Stamp): Conversation {
  switch (conversation.state) {
    case "human":
      return {
        ...append(conversation, systemMessage("handed_back", stamp)),
        state: "ai",
      };
    case "ai":
    case "waiting":
    case "closed":
      return conversation;
    default:
      return assertNever(conversation.state);
  }
}

function close(conversation: Conversation, stamp: Stamp): Conversation {
  switch (conversation.state) {
    case "ai":
    case "waiting":
    case "human":
      return {
        ...append(conversation, systemMessage("closed", stamp)),
        state: "closed",
        closedAt: stamp.at,
      };
    case "closed":
      return conversation;
    default:
      return assertNever(conversation.state);
  }
}

function reply(
  conversation: Conversation,
  body: string,
  stamp: Stamp,
): Conversation {
  switch (conversation.state) {
    case "ai":
    case "waiting":
      return append(takeOver(conversation, stamp), memberMessage(body, stamp));
    case "human":
      return append(conversation, memberMessage(body, stamp));
    case "closed":
      return conversation;
    default:
      return assertNever(conversation.state);
  }
}

export function useInbox(initial: Conversation[], openId: string | null) {
  const [conversations, setConversations] = useState(() =>
    initial.map((conversation) =>
      conversation.id === openId
        ? { ...conversation, unread: false }
        : conversation,
    ),
  );

  function update(
    id: string,
    change: (conversation: Conversation) => Conversation,
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? change(conversation) : conversation,
      ),
    );
  }

  return {
    conversations,
    markRead: (id: string) =>
      update(id, (conversation) => ({ ...conversation, unread: false })),
    takeOver: (id: string) => {
      const stamp = newStamp();
      update(id, (conversation) => takeOver(conversation, stamp));
    },
    handBack: (id: string) => {
      const stamp = newStamp();
      update(id, (conversation) => handBack(conversation, stamp));
    },
    close: (id: string) => {
      const stamp = newStamp();
      update(id, (conversation) => close(conversation, stamp));
    },
    reply: (id: string, body: string) => {
      const stamp = newStamp();
      update(id, (conversation) => reply(conversation, body, stamp));
    },
  };
}

export type InboxActions = Omit<ReturnType<typeof useInbox>, "conversations">;
