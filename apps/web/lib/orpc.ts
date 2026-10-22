import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { Router } from "@/server/orpc/router";

// oRPC's documented SSR setup: on the server this registers an in-process client
// on globalThis, so server components call procedures without HTTP.
if (typeof window === "undefined") {
  await import("./orpc.server");
}

declare global {
  var $client: RouterClient<Router> | undefined;
}

const link = new RPCLink({
  url: "/rpc",
  origin: () => {
    if (typeof window === "undefined") {
      throw new Error("The RPC link is not allowed on the server.");
    }
    return window.location.origin;
  },
});

export const client: RouterClient<Router> =
  globalThis.$client ?? createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
