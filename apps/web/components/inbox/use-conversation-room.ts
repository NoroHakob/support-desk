"use client";

import { assertNever, conversationEventSchema } from "@marshaldesk/shared";

import { useAgentDraft } from "@/hooks/use-agent-draft";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { useRemoteTyping, useTypingSender } from "@/hooks/use-typing";
import { client } from "@/lib/orpc";

/**
 * Typing in both directions for the conversation the owner has open, and the
 * agent's reply while it streams.
 */
export function useConversationRoom(conversationId: string) {
  const visitorTyping = useRemoteTyping();
  const agentDraft = useAgentDraft();
  const { send, stopped } = useRealtimeRoom({
    party: "conversation",
    room: conversationId,
    schema: conversationEventSchema,
    getToken: async () =>
      (
        await client.realtime.getToken({
          party: "conversation",
          conversationId,
        })
      ).token,
    onEvent: (event) => {
      switch (event.type) {
        case "typing":
          if (event.role === "visitor") visitorTyping.update(event.typing);
          break;
        // The workspace room already refreshes the open conversation.
        case "conversation.updated":
          break;
        case "agent.chunk":
        case "agent.done":
          agentDraft.update(event);
          break;
        default:
          return assertNever(event);
      }
    },
    onSync: () => undefined,
  });
  const typing = useTypingSender((value) =>
    send({ type: "typing", typing: value }),
  );

  return {
    visitorTyping: visitorTyping.typing,
    agentDraft: agentDraft.draft,
    onTypingInput: typing.onInput,
    stopTyping: typing.stop,
    liveUpdatesStopped: stopped,
  };
}
