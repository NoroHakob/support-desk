"use client";

import { assertNever, type ConversationEvent } from "@marshaldesk/shared";
import { useCallback, useState } from "react";

type AgentStreamEvent = Extract<
  ConversationEvent,
  { type: "agent.chunk" | "agent.done" }
>;

export type AgentDraft = { messageId: string; body: string };

/** The agent's reply while it streams; cleared by `agent.done`. */
export function useAgentDraft() {
  const [draft, setDraft] = useState<AgentDraft | null>(null);

  const update = useCallback((event: AgentStreamEvent) => {
    switch (event.type) {
      case "agent.chunk":
        setDraft({ messageId: event.messageId, body: event.body });
        break;
      case "agent.done":
        setDraft((current) =>
          current?.messageId === event.messageId ? null : current,
        );
        break;
      default:
        return assertNever(event);
    }
  }, []);

  return { draft, update };
}
