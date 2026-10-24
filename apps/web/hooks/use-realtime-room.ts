"use client";

import {
  decodeRealtimeEvent,
  encodeClientEvent,
  type ClientEvent,
  type RealtimeParty,
} from "@marshaldesk/shared";
import { usePartySocket } from "partysocket/react";
import { useCallback, useEffect, useRef } from "react";
import type * as z from "zod";

// The Worker's host, like `supportdesk-realtime-dev.<account>.workers.dev` or
// `localhost:8787`. Without it the app works, just without live updates.
const REALTIME_HOST = process.env.NEXT_PUBLIC_REALTIME_HOST || null;

type Handlers<Event> = {
  getToken: () => Promise<string>;
  onEvent: (event: Event) => void;
  // Called on every (re)connect: events sent while disconnected are lost, so
  // state is reloaded from the API (TECH-STACK section 7).
  onSync: () => void;
};

/** A socket to one room; `room` null keeps it closed. */
export function useRealtimeRoom<Schema extends z.ZodType>({
  party,
  room,
  schema,
  ...handlers
}: {
  party: RealtimeParty;
  room: string | null;
  schema: Schema;
} & Handlers<z.infer<Schema>>) {
  // The socket keeps its first options, so handlers are read through a ref.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const socket = usePartySocket({
    host: REALTIME_HOST ?? undefined,
    party,
    room: room ?? undefined,
    enabled: REALTIME_HOST !== null && room !== null,
    // A fresh 60-second token for every connect and reconnect.
    query: async () => ({ token: await handlersRef.current.getToken() }),
    onOpen: () => handlersRef.current.onSync(),
    onMessage: (message: MessageEvent) => {
      if (typeof message.data !== "string") return;
      const event = decodeRealtimeEvent(schema, message.data);
      if (event !== null) handlersRef.current.onEvent(event);
    },
  });

  // Typing is only worth sending live, never queued for a later reconnect.
  const send = useCallback(
    (event: ClientEvent) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(encodeClientEvent(event));
      }
    },
    [socket],
  );

  return { send };
}
