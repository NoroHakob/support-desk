// The postMessage protocol between the embed script on the customer's page
// (the host) and the widget iframe. Bundled into embed.js, so it imports
// nothing.

export type WidgetPlacement = "bottom-left" | "bottom-right";

export type PageContext = { page: string; referrer: string };

export type WidgetToHost =
  | { type: "supportdesk:ready"; position: WidgetPlacement; accentHex: string }
  | { type: "supportdesk:close" };

export type HostToWidget =
  | ({ type: "supportdesk:context" } & PageContext)
  | ({ type: "supportdesk:open" } & PageContext);

function record(data: unknown): Record<string, unknown> | null {
  return typeof data === "object" && data !== null
    ? (data as Record<string, unknown>)
    : null;
}

export function parseWidgetToHost(data: unknown): WidgetToHost | null {
  const message = record(data);
  switch (message?.["type"]) {
    case "supportdesk:ready": {
      const position = message["position"];
      const accentHex = message["accentHex"];
      if (
        (position === "bottom-left" || position === "bottom-right") &&
        typeof accentHex === "string" &&
        /^#[0-9a-f]{6}$/i.test(accentHex)
      ) {
        return { type: "supportdesk:ready", position, accentHex };
      }
      return null;
    }
    case "supportdesk:close":
      return { type: "supportdesk:close" };
    default:
      return null;
  }
}

export function parseHostToWidget(data: unknown): HostToWidget | null {
  const message = record(data);
  const type = message?.["type"];
  if (type !== "supportdesk:context" && type !== "supportdesk:open") {
    return null;
  }
  const page = message?.["page"];
  const referrer = message?.["referrer"];
  if (typeof page !== "string" || typeof referrer !== "string") {
    return null;
  }
  return { type, page, referrer };
}
