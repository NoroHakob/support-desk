import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { Router } from "@/server/orpc/router";

// The widget runs in an iframe on customers' sites, so it authenticates with
// the visitor token instead of cookies.
let visitorToken: string | null = null;

export function setVisitorToken(token: string | null) {
  visitorToken = token;
}

const link = new RPCLink({
  url: "/rpc",
  origin: () => window.location.origin,
  headers: (): Record<string, string> =>
    visitorToken ? { authorization: `Bearer ${visitorToken}` } : {},
});

export const widgetClient: RouterClient<Router> = createORPCClient(link);

export const widgetOrpc = createTanstackQueryUtils(widgetClient, {
  path: ["widget-visitor"],
});

function storageKey(workspaceId: string) {
  return `supportdesk.visitor.${workspaceId}`;
}

// Storage can be blocked (private mode, third-party storage rules); the widget
// still works, it just starts a new visitor on the next page load.
export function readStoredToken(workspaceId: string) {
  try {
    return window.localStorage.getItem(storageKey(workspaceId));
  } catch {
    return null;
  }
}

export function storeToken(workspaceId: string, token: string | null) {
  try {
    if (token) window.localStorage.setItem(storageKey(workspaceId), token);
    else window.localStorage.removeItem(storageKey(workspaceId));
  } catch {
    // Kept in memory only.
  }
}
