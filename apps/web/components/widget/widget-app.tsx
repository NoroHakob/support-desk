"use client";

import {
  assertNever,
  conversationEventSchema,
  MESSAGE_MAX_LENGTH,
  visitorMessageInputSchema,
  widgetColorHex,
  type WidgetConfig,
  type WidgetConversation,
  type WidgetMessage,
} from "@marshaldesk/shared";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, SendHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MessageMarkdown } from "@/components/message-markdown";
import { TypingDots } from "@/components/typing-dots";
import { AgentAvatar } from "@/components/widget/widget-panel";
import { useAgentDraft } from "@/hooks/use-agent-draft";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { useRemoteTyping, useTypingSender } from "@/hooks/use-typing";
import { agentAvatarUri, memberAvatarUri } from "@/lib/avatar";
import { playNotificationSound } from "@/lib/notification-sound";
import {
  readStoredToken,
  setVisitorToken,
  storeToken,
  widgetClient,
  widgetOrpc,
} from "@/lib/widget-client";
import { widgetNoticeText } from "@/lib/widget-copy";
import {
  parseHostToWidget,
  type PageContext,
  type WidgetToHost,
} from "@/lib/widget-messages";

function postToHost(message: WidgetToHost) {
  if (window.parent !== window) {
    // The host page's origin isn't known here, and nothing sent is private.
    window.parent.postMessage(message, "*");
  }
}

function isUnauthorized(error: unknown) {
  return error instanceof ORPCError && error.code === "UNAUTHORIZED";
}

// Every change adds a message, so a copy with fewer messages is an older one
// that arrived late.
function upsertConversation(
  current: WidgetConversation[] | undefined,
  conversation: WidgetConversation,
) {
  const list = current ?? [];
  const existing = list.find((item) => item.id === conversation.id);
  if (!existing) return [...list, conversation];
  if (existing.messages.length > conversation.messages.length) return list;
  return list.map((item) =>
    item.id === conversation.id ? conversation : item,
  );
}

export function WidgetApp({
  workspaceId,
  host,
  initialConfig,
}: {
  workspaceId: string;
  host: string;
  initialConfig: WidgetConfig;
}) {
  // Fetched again whenever the widget opens or the page comes back, so the
  // agent turning on or off (sources added or deleted) shows without a reload.
  const { data: config, refetch: refetchConfig } = useQuery({
    ...widgetOrpc.widget.config.queryOptions({
      input: { workspaceId, host },
    }),
    initialData: initialConfig,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: "always",
  });
  const accentHex = widgetColorHex[config.color];
  const agentAvatarUrl = useMemo(
    () => config.agentAvatarUrl ?? agentAvatarUri(workspaceId, accentHex),
    [config.agentAvatarUrl, workspaceId, accentHex],
  );
  const queryClient = useQueryClient();
  const conversationsKey = widgetOrpc.widget.conversations.queryKey();
  const [sessionReady, setSessionReady] = useState(false);
  const contextRef = useRef<PageContext>({ page: "", referrer: "" });
  const startingRef = useRef<Promise<void> | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // PRD W-3: the first open issues a visitor token; a stored one is resumed.
  const startSession = useCallback(
    (fresh: boolean) => {
      if (startingRef.current && !fresh) return startingRef.current;
      const starting = (async () => {
        const { token } = await widgetClient.widget.start({
          workspaceId,
          host,
          token: fresh ? null : readStoredToken(workspaceId),
          visitor: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
            language: navigator.language || null,
            page: contextRef.current.page.slice(0, 2000) || null,
            referrer: contextRef.current.referrer.slice(0, 2000) || null,
          },
        });
        storeToken(workspaceId, token);
        setVisitorToken(token);
        setSessionReady(true);
      })();
      startingRef.current = starting;
      starting.catch(() => {
        startingRef.current = null;
      });
      return starting;
    },
    [workspaceId, host],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const message = parseHostToWidget(event.data);
      if (!message) return;
      contextRef.current = { page: message.page, referrer: message.referrer };
      switch (message.type) {
        case "supportdesk:context":
          if (readStoredToken(workspaceId)) void startSession(false);
          break;
        case "supportdesk:open":
          void startSession(false);
          void refetchConfig();
          composerRef.current?.focus();
          break;
        default:
          return assertNever(message);
      }
    }
    window.addEventListener("message", onMessage);
    postToHost({
      type: "supportdesk:ready",
      position: config.position,
      accentHex,
    });
    if (window.parent === window && readStoredToken(workspaceId)) {
      void startSession(false);
    }
    return () => window.removeEventListener("message", onMessage);
  }, [workspaceId, config.position, accentHex, startSession, refetchConfig]);

  const conversations = useQuery({
    ...widgetOrpc.widget.conversations.queryOptions(),
    enabled: sessionReady,
    refetchOnWindowFocus: "always",
  });

  const { error: conversationsError, refetch: refetchConversations } =
    conversations;
  const restartedRef = useRef(false);
  useEffect(() => {
    if (isUnauthorized(conversationsError) && !restartedRef.current) {
      restartedRef.current = true;
      void startSession(true).then(() => refetchConversations());
    }
  }, [conversationsError, refetchConversations, startSession]);

  // A stale token (the visitor was removed, or the domain changed) gets one
  // fresh session before the action is retried.
  async function withSession<T>(action: () => Promise<T>) {
    await startSession(false);
    try {
      return await action();
    } catch (error) {
      if (!isUnauthorized(error)) throw error;
      await startSession(true);
      return action();
    }
  }

  const send = useMutation({
    mutationFn: (body: string) =>
      withSession(() => widgetClient.widget.sendMessage({ body })),
    onSuccess: (conversation) =>
      queryClient.setQueryData(conversationsKey, (current) =>
        upsertConversation(current, conversation),
      ),
  });
  const requestHuman = useMutation({
    mutationFn: () => withSession(() => widgetClient.widget.requestHuman()),
    onSuccess: (conversation) =>
      queryClient.setQueryData(conversationsKey, (current) =>
        upsertConversation(current, conversation),
      ),
  });

  const list = conversations.data ?? [];
  const latest = list.at(-1);

  // The latest conversation's room: owner replies, state changes and typing.
  const memberTyping = useRemoteTyping();
  const agentDraft = useAgentDraft();
  const { send: sendToRoom } = useRealtimeRoom({
    party: "conversation",
    room: latest?.id ?? null,
    schema: conversationEventSchema,
    getToken: async () =>
      (
        await withSession(() =>
          widgetClient.widget.getRealtimeToken({ conversationId: latest?.id }),
        )
      ).token,
    onEvent: (event) => {
      switch (event.type) {
        case "conversation.updated": {
          const known = new Set(
            queryClient
              .getQueryData(conversationsKey)
              ?.find((item) => item.id === event.conversation.id)
              ?.messages.map((message) => message.id),
          );
          const ownerReplied = event.conversation.messages.some(
            (message) => message.author === "member" && !known.has(message.id),
          );
          queryClient.setQueryData(conversationsKey, (current) =>
            upsertConversation(current, event.conversation),
          );
          if (ownerReplied) {
            memberTyping.update(false);
            // PRD W-12: a chime when the visitor isn't looking.
            if (document.visibilityState !== "visible") {
              playNotificationSound();
            }
          }
          break;
        }
        case "typing":
          if (event.role === "member") memberTyping.update(event.typing);
          break;
        case "agent.chunk":
        case "agent.done":
          agentDraft.update(event);
          break;
        default:
          return assertNever(event);
      }
    },
    onSync: () =>
      void queryClient.invalidateQueries({ queryKey: conversationsKey }),
  });
  const typing = useTypingSender((value) =>
    sendToRoom({ type: "typing", typing: value }),
  );
  const showTyping =
    memberTyping.typing && latest !== undefined && latest.state !== "closed";
  const pendingBody = send.isPending ? send.variables : null;
  const draft =
    agentDraft.draft &&
    !latest?.messages.some(
      (message) => message.id === agentDraft.draft?.messageId,
    )
      ? agentDraft.draft
      : null;
  // The agent is working on the visitor's newest message.
  const agentThinking =
    latest?.state === "ai" &&
    latest.messages.findLast((message) => message.author !== "system")
      ?.author === "visitor" &&
    draft === null &&
    pendingBody === null;
  const showGreeting = !latest || latest.state === "closed";
  const showSuggestions =
    config.agentOn &&
    showGreeting &&
    pendingBody === null &&
    config.suggestedQuestions.length > 0;
  const canAskForPerson = config.agentOn && latest?.state === "ai";
  const messageCount = list.reduce(
    (total, conversation) => total + conversation.messages.length,
    0,
  );

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount, pendingBody, showTyping, agentThinking, draft?.body]);

  return (
    <div
      style={{ "--widget-accent": accentHex } as React.CSSProperties}
      className="flex h-dvh flex-col bg-background text-foreground"
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <AgentAvatar src={agentAvatarUrl} name={config.agentName} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-[19px] leading-6 tracking-[-0.02em]">
            {config.agentName}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-(--widget-accent)" />
            {config.agentOn
              ? "Answers right away, any time"
              : "A person will reply here"}
          </span>
        </div>
        <button
          type="button"
          aria-label="Close chat"
          onClick={() => postToHost({ type: "supportdesk:close" })}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-(--widget-accent)/40 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 py-4">
          {list.map((conversation) =>
            conversation.messages.map((message) => (
              <MessageView
                key={message.id}
                message={message}
                agentName={config.agentName}
                agentAvatarUrl={agentAvatarUrl}
              />
            )),
          )}
          {showGreeting ? (
            <AgentBubble avatarUrl={agentAvatarUrl} name={config.agentName}>
              <MessageMarkdown body={config.greeting} />
            </AgentBubble>
          ) : null}
          {showSuggestions ? (
            <ul className="ml-8 divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10">
              {config.suggestedQuestions.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => send.mutate(question)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                  >
                    <span>{question}</span>
                    <ArrowRight className="size-4 shrink-0 text-(--widget-accent)" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {pendingBody ? (
            <VisitorBubble pending>
              <MessageMarkdown body={pendingBody} />
            </VisitorBubble>
          ) : null}
          {draft ? (
            <AgentBubble avatarUrl={agentAvatarUrl} name={config.agentName}>
              <MessageMarkdown body={draft.body} />
            </AgentBubble>
          ) : null}
          {agentThinking ? (
            <div className="ml-8 flex">
              <div className="rounded-xl rounded-bl-sm bg-muted px-3 py-3 text-muted-foreground">
                <TypingDots />
                <span className="sr-only">{config.agentName} is typing</span>
              </div>
            </div>
          ) : null}
          {showTyping ? (
            <div className="ml-8 flex">
              <div className="rounded-xl rounded-bl-sm bg-muted px-3 py-3 text-muted-foreground">
                <TypingDots />
                <span className="sr-only">Someone from the team is typing</span>
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <footer className="flex flex-col gap-2 px-3 pb-3">
        {canAskForPerson ? (
          <button
            type="button"
            disabled={requestHuman.isPending}
            onClick={() => requestHuman.mutate()}
            className="self-center rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-foreground/10 transition-colors hover:bg-muted disabled:opacity-60"
          >
            Talk to a human
          </button>
        ) : null}
        {send.isError || requestHuman.isError ? (
          <p role="alert" className="px-1 text-xs text-destructive">
            Something went wrong. Please try again.
          </p>
        ) : null}
        <Composer
          ref={composerRef}
          disabled={send.isPending}
          onSend={(body) => {
            typing.stop();
            return send.mutateAsync(body);
          }}
          onTyping={typing.onInput}
        />
      </footer>
    </div>
  );
}

function Composer({
  ref,
  disabled,
  onSend,
  onTyping,
}: {
  ref: React.Ref<HTMLTextAreaElement>;
  disabled: boolean;
  onSend: (body: string) => Promise<unknown>;
  onTyping: () => void;
}) {
  const [draft, setDraft] = useState("");
  const valid = visitorMessageInputSchema.safeParse({ body: draft }).success;

  function submit() {
    const parsed = visitorMessageInputSchema.safeParse({ body: draft });
    if (!parsed.success || disabled) return;
    // Cleared right away because the pending bubble shows the message; it
    // comes back if sending fails, unless the visitor has started a new one.
    setDraft("");
    onSend(parsed.data.body).catch(() =>
      setDraft((current) => (current === "" ? draft : current)),
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex items-end gap-1 rounded-lg bg-background py-1 pr-1 pl-3 ring-1 ring-foreground/15 focus-within:ring-(--widget-accent)"
    >
      <textarea
        ref={ref}
        aria-label="Message"
        rows={1}
        maxLength={MESSAGE_MAX_LENGTH}
        placeholder="Write a message…"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onTyping();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        className="[field-sizing:content] max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={!valid || disabled}
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-(--widget-accent) text-white transition-opacity disabled:opacity-50"
      >
        <SendHorizontal className="size-4" />
      </button>
    </form>
  );
}

function AgentBubble({
  avatarUrl,
  name,
  children,
}: {
  avatarUrl: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-end gap-2">
      <AgentAvatar src={avatarUrl} name={name} size="sm" />
      <div className="flex max-w-[85%] min-w-0 flex-col gap-1">
        <span className="px-1 text-xs text-muted-foreground">{name}</span>
        <div className="rounded-xl rounded-bl-sm bg-muted px-3 py-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function VisitorBubble({
  pending = false,
  children,
}: {
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-end">
      <div
        aria-busy={pending}
        className="max-w-[85%] rounded-xl rounded-br-sm bg-(--widget-accent) px-3 py-2 text-white aria-busy:opacity-60 [&_a]:text-white [&_a]:underline"
      >
        {children}
      </div>
    </div>
  );
}

function MessageView({
  message,
  agentName,
  agentAvatarUrl,
}: {
  message: WidgetMessage;
  agentName: string;
  agentAvatarUrl: string;
}) {
  switch (message.author) {
    case "system":
      if (message.systemEvent === null) return null;
      if (message.systemEvent === "greeting") {
        return (
          <AgentBubble avatarUrl={agentAvatarUrl} name={agentName}>
            <MessageMarkdown body={message.body} />
          </AgentBubble>
        );
      }
      return (
        <p className="mx-auto max-w-[90%] py-1 text-center text-xs text-muted-foreground">
          {widgetNoticeText(message.systemEvent)}
        </p>
      );
    case "visitor":
      return (
        <VisitorBubble>
          <MessageMarkdown body={message.body} />
        </VisitorBubble>
      );
    case "agent":
      return (
        <AgentBubble avatarUrl={agentAvatarUrl} name={agentName}>
          <MessageMarkdown body={message.body} />
        </AgentBubble>
      );
    case "member": {
      const name = message.member?.name ?? "Support team";
      return (
        <AgentBubble
          avatarUrl={message.member?.imageUrl ?? memberAvatarUri(name)}
          name={name}
        >
          <MessageMarkdown body={message.body} />
        </AgentBubble>
      );
    }
    default:
      return assertNever(message.author);
  }
}
