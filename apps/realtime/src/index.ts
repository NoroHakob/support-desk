import {
  conversationServerEventSchema,
  decodeClientEvent,
  decodeRealtimeEvent,
  encodeRealtimeEvent,
  REALTIME_TOKEN_AUDIENCE,
  realtimeRoleSchema,
  realtimeTokenClaimsSchema,
  workspaceEventSchema,
  type RealtimeRole,
  type RealtimeTokenClaims,
} from "@marshaldesk/shared/realtime";
import { jwtVerify } from "jose";
import {
  routePartykitRequest,
  Server,
  type Connection,
  type ConnectionContext,
  type Lobby,
  type WSMessage,
} from "partyserver";
import type * as z from "zod";

type Env = {
  Conversation: DurableObjectNamespace<Conversation>;
  Workspace: DurableObjectNamespace<Workspace>;
  REALTIME_TOKEN_SECRET: string;
  REALTIME_PUBLISH_SECRET: string;
};

// Clients can send any header, so these are cleared before the trusted ones
// are set.
const HEADER_PREFIX = "x-marshaldesk-";
const ROLE_HEADER = `${HEADER_PREFIX}role`;

type ConnectionState = { role: RealtimeRole };

async function verifyToken(
  token: string,
  env: Env,
): Promise<RealtimeTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(env.REALTIME_TOKEN_SECRET),
      { audience: REALTIME_TOKEN_AUDIENCE, algorithms: ["HS256"] },
    );
    const claims = realtimeTokenClaimsSchema.safeParse(payload);
    return claims.success ? claims.data : null;
  } catch {
    return null;
  }
}

function roomAllows(lobby: Lobby<Env>, claims: RealtimeTokenClaims) {
  switch (lobby.className) {
    case "Workspace":
      return (
        claims.role === "member" &&
        claims.cid === null &&
        claims.wid === lobby.name
      );
    case "Conversation":
      return claims.cid === lobby.name;
    default:
      return false;
  }
}

async function authorizeSocket(request: Request, lobby: Lobby<Env>, env: Env) {
  const token = new URL(request.url).searchParams.get("token");
  const claims = token ? await verifyToken(token, env) : null;
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!roomAllows(lobby, claims)) {
    return new Response("Forbidden", { status: 403 });
  }
  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (!name.toLowerCase().startsWith(HEADER_PREFIX)) {
      headers.set(name, value);
    }
  }
  headers.set(ROLE_HEADER, claims.role);
  return new Request(request, { headers });
}

// Both values are hashed first so the comparison takes the same time whatever
// their lengths.
async function secretMatches(given: string, expected: string) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(given)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function authorizePublish(request: Request, env: Env) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const authorization = request.headers.get("authorization") ?? "";
  const secret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!secret || !(await secretMatches(secret, env.REALTIME_PUBLISH_SECRET))) {
    return new Response("Unauthorized", { status: 401 });
  }
  return undefined;
}

// The body is broadcast exactly as the web app encoded it, once it's known to
// be a valid event for the room.
async function broadcastPublished(
  server: Server<Env>,
  request: Request,
  schema: z.ZodType,
) {
  const body = await request.text();
  if (!decodeRealtimeEvent(schema, body)) {
    return new Response("Invalid event", { status: 400 });
  }
  server.broadcast(body);
  return new Response(null, { status: 204 });
}

/** One room per conversation: the visitor and the owner viewing it. */
export class Conversation extends Server<Env> {
  static options = { hibernate: true };

  onConnect(connection: Connection<ConnectionState>, ctx: ConnectionContext) {
    const role = realtimeRoleSchema.safeParse(
      ctx.request.headers.get(ROLE_HEADER),
    );
    if (!role.success) {
      connection.close(1008, "Unauthorized");
      return;
    }
    connection.setState({ role: role.data });
  }

  // Only typing comes from clients, relayed with the role from the token.
  onMessage(connection: Connection<ConnectionState>, message: WSMessage) {
    const role = connection.state?.role;
    if (typeof message !== "string" || !role) return;
    const event = decodeClientEvent(message);
    if (!event) return;
    this.broadcast(
      encodeRealtimeEvent({ type: "typing", role, typing: event.typing }),
      [connection.id],
    );
  }

  onRequest(request: Request) {
    return broadcastPublished(this, request, conversationServerEventSchema);
  }
}

/** One room per workspace: inbox updates for the owner. */
export class Workspace extends Server<Env> {
  static options = { hibernate: true };

  onRequest(request: Request) {
    return broadcastPublished(this, request, workspaceEventSchema);
  }
}

export default {
  async fetch(request, env) {
    const response = await routePartykitRequest(request, env, {
      onBeforeConnect: (req, lobby) => authorizeSocket(req, lobby, env),
      onBeforeRequest: (req) => authorizePublish(req, env),
    });
    return response ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
