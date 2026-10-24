"use client";

import { assertNever, conversationEventSchema } from "@marshaldesk/shared";

import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { useRemoteTyping, useTypingSender } from "@/hooks/use-typing";
import { client } from "@/lib/orpc";

/** Typing in both directions for the conversation the owner has open. */
export function useConversationRoom(conversationId: string) {
  const visitorTyping = useRemoteTyping();
  const { send } = useRealtimeRoom({
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
    onTypingInput: typing.onInput,
    stopTyping: typing.stop,
  };
}
