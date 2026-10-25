"use client";

import {
  assertNever,
  MESSAGE_MAX_LENGTH,
  replyInputSchema,
  type Conversation,
} from "@marshaldesk/shared";
import { Bot, CircleX, Hand, PanelRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/dashboard/icon-button";
import { MessageItem } from "@/components/inbox/message-item";
import { StateBadge } from "@/components/inbox/state-badge";
import { useConversationRoom } from "@/components/inbox/use-conversation-room";
import { VisitorAvatar } from "@/components/inbox/visitor-avatar";
import type { InboxActions } from "@/components/inbox/use-inbox";
import { MessageMarkdown } from "@/components/message-markdown";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypingDots } from "@/components/typing-dots";
import { handoffReasonText } from "@/lib/conversation-copy";
import { formatAgo } from "@/lib/format";
import { visitorTitle } from "@/lib/visitor";

export function ConversationView({
  conversation,
  avatarUrl,
  actions,
  busy,
  error,
  onOpenDetails,
}: {
  conversation: Conversation;
  avatarUrl: string | undefined;
  actions: InboxActions;
  busy: boolean;
  error: string | null;
  onOpenDetails?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const messageCount = conversation.messages.length;
  const { visitorTyping, agentDraft, onTypingInput, stopTyping } =
    useConversationRoom(conversation.id);
  const showTyping = visitorTyping && conversation.state !== "closed";
  const draft =
    agentDraft &&
    !conversation.messages.some(
      (message) => message.id === agentDraft.messageId,
    )
      ? agentDraft
      : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.id, messageCount, showTyping, draft?.body]);

  return (
    <div className="@container/conversation flex h-full flex-col">
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
        <HeaderActions
          conversation={conversation}
          actions={actions}
          busy={busy}
        />
        {onOpenDetails ? (
          <IconButton label="Visitor details" onClick={onOpenDetails}>
            <PanelRight />
          </IconButton>
        ) : null}
      </header>
      {error ? (
        <p role="alert" className="border-b px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-4 py-5">
          {conversation.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              handoffReason={conversation.handoffReason}
            />
          ))}
          {draft ? (
            <div className="flex flex-col items-end gap-1">
              <div
                aria-busy
                className="max-w-[80%] rounded-xl border border-primary/45 bg-primary/8 px-3.5 py-2.5"
              >
                <MessageMarkdown body={draft.body} />
              </div>
              <span className="px-1 text-xs text-muted-foreground">
                Agent is writing…
              </span>
            </div>
          ) : null}
          {showTyping ? (
            <p className="flex animate-fade-in items-center gap-2 px-1 text-xs text-muted-foreground motion-reduce:animate-none">
              <TypingDots />
              The visitor is typing…
            </p>
          ) : null}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <Composer
        key={conversation.id}
        conversation={conversation}
        busy={busy}
        onSend={(body) => {
          stopTyping();
          return actions.reply(conversation.id, body);
        }}
        onTyping={onTypingInput}
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
  busy,
}: {
  conversation: Conversation;
  actions: InboxActions;
  busy: boolean;
}) {
  const close = () => actions.close(conversation.id);
  // Labelled while the panel has room; icon-only with a tooltip when narrow.
  const closeButton = (
    <>
      <span className="hidden @min-[34rem]/conversation:contents">
        <Button variant="outline" disabled={busy} onClick={close}>
          <CircleX />
          Close
        </Button>
      </span>
      <span className="contents @min-[34rem]/conversation:hidden">
        <IconButton label="Close conversation" disabled={busy} onClick={close}>
          <CircleX />
        </IconButton>
      </span>
    </>
  );

  switch (conversation.state) {
    case "ai":
      return (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            disabled={busy}
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
          <Button
            disabled={busy}
            onClick={() => actions.takeOver(conversation.id)}
          >
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
            disabled={busy}
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
  busy,
  onSend,
  onTyping,
}: {
  conversation: Conversation;
  busy: boolean;
  onSend: (body: string) => Promise<unknown>;
  onTyping: () => void;
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
    if (!result.success || busy) return;
    // The draft stays if sending fails, so nothing typed is lost.
    onSend(result.data.body).then(
      () => setDraft(""),
      () => undefined,
    );
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
          onChange={(event) => {
            setDraft(event.target.value);
            onTyping();
          }}
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
            disabled={!valid || busy}
            className="ml-auto"
          >
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
