import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { after } from "next/server";

import { router } from "@/server/orpc/router";

// The agent streams its reply inside `after()` (TECH-STACK section 8).
export const maxDuration = 300;

const handler = new RPCHandler(router, {
  interceptors: [onError((error) => console.error(error))],
});

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    context: { headers: request.headers, after },
  });
  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
