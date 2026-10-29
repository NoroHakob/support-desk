// The postMessage protocol between the embed script on the customer's page
// (the host) and the widget iframe. Bundled into embed.js, so it imports
// nothing.

export type WidgetPlacement = "bottom-left" | "bottom-right";

export type PageContext = { page: string; referrer: string };

export type WidgetReplyAuthor = "agent" | "member";

export type WidgetToHost =
  | { type: "supportdesk:ready"; position: WidgetPlacement; accentHex: string }
  | { type: "supportdesk:close" }
  | {
      type: "supportdesk:reply";
      id: string;
      author: WidgetReplyAuthor;
      body: string;
    };

export type HostToWidget =
  | ({ type: "supportdesk:context" } & PageContext)
  | ({ type: "supportdesk:open" } & PageContext)
  | { type: "supportdesk:send"; body: string };

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
    case "supportdesk:reply": {
      const id = message["id"];
      const author = message["author"];
      const body = message["body"];
      if (
        typeof id === "string" &&
        (author === "agent" || author === "member") &&
        typeof body === "string"
      ) {
        return { type: "supportdesk:reply", id, author, body };
      }
      return null;
    }
    default:
      return null;
  }
}

export function parseHostToWidget(data: unknown): HostToWidget | null {
  const message = record(data);
  const type = message?.["type"];
  if (type === "supportdesk:send") {
    const body = message?.["body"];
    return typeof body === "string" ? { type, body } : null;
  }
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
