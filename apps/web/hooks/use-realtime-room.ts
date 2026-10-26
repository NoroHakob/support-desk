"use client";

import {
  decodeRealtimeEvent,
  encodeClientEvent,
  type ClientEvent,
  type RealtimeParty,
} from "@marshaldesk/shared";
import { ORPCError } from "@orpc/client";
import type PartySocket from "partysocket";
import { usePartySocket } from "partysocket/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as z from "zod";

// The Worker's host, like `supportdesk-realtime-dev.<account>.workers.dev` or
// `localhost:8787`. Without it the app works, just without live updates.
const REALTIME_HOST = process.env.NEXT_PUBLIC_REALTIME_HOST || null;

// Token errors that every retry would hit again: a page left open from before
// an update (BAD_REQUEST), a signed-out owner, a removed domain or a deleted
// conversation. partysocket would otherwise retry them forever.
const PERMANENT_TOKEN_ERRORS = new Set([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
]);

function isPermanentTokenError(error: unknown) {
  return error instanceof ORPCError && PERMANENT_TOKEN_ERRORS.has(error.code);
}

type Handlers<Event> = {
  getToken: () => Promise<string>;
  onEvent: (event: Event) => void;
  // Called on every (re)connect: events sent while disconnected are lost, so
  // state is reloaded from the API (TECH-STACK section 7).
  onSync: () => void;
};

/**
 * A socket to one room; `room` null keeps it closed. `stopped` turns true
 * when the room can't be joined again without reloading the page.
 */
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
  const socketRef = useRef<PartySocket | null>(null);
  const [stoppedRoom, setStoppedRoom] = useState<string | null>(null);

  const socket = usePartySocket({
    host: REALTIME_HOST ?? undefined,
    party,
    room: room ?? undefined,
    enabled: REALTIME_HOST !== null && room !== null,
    // A fresh 60-second token for every connect and reconnect.
    query: async () => {
      try {
        return { token: await handlersRef.current.getToken() };
      } catch (error) {
        if (isPermanentTokenError(error)) {
          console.error(`Live updates for ${party} ${room} stopped.`, error);
          socketRef.current?.close();
          setStoppedRoom(room);
        }
        throw error;
      }
    },
    onOpen: () => handlersRef.current.onSync(),
    onMessage: (message: MessageEvent) => {
      if (typeof message.data !== "string") return;
      const event = decodeRealtimeEvent(schema, message.data);
      if (event !== null) handlersRef.current.onEvent(event);
    },
  });
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Typing is only worth sending live, never queued for a later reconnect.
  const send = useCallback(
    (event: ClientEvent) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(encodeClientEvent(event));
      }
    },
    [socket],
  );

  return { send, stopped: room !== null && stoppedRoom === room };
}
