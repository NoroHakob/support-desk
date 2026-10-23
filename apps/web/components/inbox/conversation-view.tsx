"use client";

import {
  assertNever,
  MESSAGE_MAX_LENGTH,
  replyInputSchema,
  type Conversation,
} from "@marshaldesk/shared";
import { Bot, CircleCheck, Hand, PanelRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/dashboard/icon-button";
import { MessageItem } from "@/components/inbox/message-item";
import { StateBadge } from "@/components/inbox/state-badge";
import { VisitorAvatar } from "@/components/inbox/visitor-avatar";
import type { InboxActions } from "@/components/inbox/use-inbox";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { handoffReasonText } from "@/lib/conversation-copy";
import { formatAgo } from "@/lib/format";
import { visitorTitle } from "@/lib/visitor";

export function ConversationView({
  conversation,
  avatarUrl,
  actions,
  onOpenDetails,
}: {
  conversation: Conversation;
  avatarUrl: string | undefined;
  actions: InboxActions;
  onOpenDetails?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const messageCount = conversation.messages.length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.id, messageCount]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex min-h-16 items-center gap-3 border-b px-4 py-3">
        <VisitorAvatar src={avatarUrl} className="size-9" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">
              {visitorTitle(conversation.visitor.details)}
            </h2>
            <StateBadge state={conversation.state} />
          </div>
          <p
            className="truncate text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {headerLine(conversation)}
          </p>
        </div>
        <HeaderActions conversation={conversation} actions={actions} />
        {onOpenDetails ? (
          <IconButton label="Visitor details" onClick={onOpenDetails}>
            <PanelRight />
          </IconButton>
        ) : null}
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-4 py-5">
          {conversation.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              handoffReason={conversation.handoffReason}
            />
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <Composer
        key={conversation.id}
        conversation={conversation}
        onSend={(body) => actions.reply(conversation.id, body)}
      />
    </div>
  );
}

function headerLine(conversation: Conversation) {
  switch (conversation.state) {
    case "waiting":
      return conversation.handoffReason
        ? handoffReasonText(conversation.handoffReason)
        : "Waiting for you.";
    case "ai":
      return `The agent is replying. Started ${formatAgo(conversation.createdAt)}.`;
    case "human":
      return `You're replying. Started ${formatAgo(conversation.createdAt)}.`;
    case "closed":
      return conversation.closedAt
        ? `Closed ${formatAgo(conversation.closedAt)}.`
        : "Closed.";
    default:
      return assertNever(conversation.state);
  }
}

function HeaderActions({
  conversation,
  actions,
}: {
  conversation: Conversation;
  actions: InboxActions;
}) {
  const closeButton = (
    <IconButton
      label="Close conversation"
      onClick={() => actions.close(conversation.id)}
    >
      <CircleCheck />
    </IconButton>
  );

  switch (conversation.state) {
    case "ai":
      return (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            onClick={() => actions.takeOver(conversation.id)}
          >
            <Hand />
            Take over
          </Button>
          {closeButton}
        </div>
      );
    case "waiting":
      return (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button onClick={() => actions.takeOver(conversation.id)}>
            <Hand />
            Take over
          </Button>
          {closeButton}
        </div>
      );
    case "human":
      return (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            onClick={() => actions.handBack(conversation.id)}
          >
            <Bot />
            Hand to agent
          </Button>
          {closeButton}
        </div>
      );
    case "closed":
      return null;
    default:
      return assertNever(conversation.state);
  }
}

function composerPlaceholder(conversation: Conversation) {
  switch (conversation.state) {
    case "ai":
    case "waiting":
      return "Reply to take over from the agent…";
    case "human":
      return "Write a reply…";
    case "closed":
      return "";
    default:
      return assertNever(conversation.state);
  }
}

function Composer({
  conversation,
  onSend,
}: {
  conversation: Conversation;
  onSend: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const valid = replyInputSchema.safeParse({ body: draft }).success;

  if (conversation.state === "closed") {
    return (
      <div className="border-t px-4 py-4 text-center text-sm text-muted-foreground">
        This conversation is closed. If the visitor writes again, it starts a
        new conversation.
      </div>
    );
  }

  function send() {
    const result = replyInputSchema.safeParse({ body: draft });
    if (!result.success) return;
    onSend(result.data.body);
    setDraft("");
  }

  return (
    <form
      className="p-3"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <InputGroup className="h-auto">
        <InputGroupTextarea
          aria-label="Reply"
          rows={2}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder={composerPlaceholder(conversation)}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              send();
            }
          }}
          className="max-h-48 min-h-16"
        />
        <InputGroupAddon align="block-end" className="justify-between">
          <KbdGroup className="text-xs font-normal text-muted-foreground">
            <Kbd>Ctrl</Kbd>
            <Kbd>Enter</Kbd>
            <span>to send</span>
          </KbdGroup>
          <InputGroupButton
            type="submit"
            size="sm"
            variant="default"
            disabled={!valid}
            className="ml-auto"
          >
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
