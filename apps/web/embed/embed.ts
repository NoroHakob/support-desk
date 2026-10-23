// The loader a customer pastes into their site:
//   <script src="https://<app>/embed.js" data-workspace="<id>" async></script>
// It adds the launcher and a hidden widget iframe. The launcher only appears
// once the iframe reports it's ready, which it never does on a domain that
// isn't allowed (the iframe's frame-ancestors policy blocks it).

import {
  parseWidgetToHost,
  type HostToWidget,
  type WidgetPlacement,
} from "../lib/widget-messages";

const ROOT_ID = "supportdesk-widget";
const PHONE_MAX_WIDTH = 640;

const CHAT_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>';
const CLOSE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

const STYLES = `
  :host { all: initial; }
  .launcher {
    position: fixed; bottom: 20px; z-index: 2147483646;
    width: 56px; height: 56px; border: 0; border-radius: 9999px;
    display: none; align-items: center; justify-content: center;
    color: #fff; cursor: pointer;
    box-shadow: 0 8px 24px -6px rgb(0 0 0 / 0.35);
    transition: transform 150ms ease;
  }
  .launcher:hover { transform: scale(1.05); }
  .launcher:focus-visible { outline: 3px solid rgb(0 0 0 / 0.35); outline-offset: 3px; }
  .launcher[data-ready="true"] { display: flex; }
  .frame {
    position: fixed; bottom: 88px; z-index: 2147483647;
    width: 400px; height: min(680px, calc(100dvh - 108px));
    border: 0; border-radius: 16px; background: #fff;
    box-shadow: 0 18px 50px -12px rgb(0 0 0 / 0.35);
    opacity: 0; transform: translateY(8px); pointer-events: none;
    visibility: hidden;
    transition: opacity 150ms ease, transform 150ms ease, visibility 0s 150ms;
  }
  .frame[data-open="true"] {
    opacity: 1; transform: none; pointer-events: auto; visibility: visible;
    transition: opacity 150ms ease, transform 150ms ease;
  }
  .left { left: 20px; }
  .right { right: 20px; }
  @media (max-width: ${PHONE_MAX_WIDTH}px) {
    .frame { inset: 0; width: 100vw; height: 100dvh; border-radius: 0; }
    .launcher[data-open="true"] { display: none; }
  }
`;

function start() {
  const script = document.currentScript;
  if (!(script instanceof HTMLScriptElement) || !script.src) return;
  const workspaceId = script.dataset["workspace"];
  if (!workspaceId || document.getElementById(ROOT_ID)) return;
  const appOrigin = new URL(script.src).origin;

  const root = document.createElement("div");
  root.id = ROOT_ID;
  const shadow = root.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = STYLES;

  const frame = document.createElement("iframe");
  frame.className = "frame right";
  frame.title = "Chat";
  frame.src = `${appOrigin}/widget/${encodeURIComponent(workspaceId)}?host=${encodeURIComponent(window.location.hostname)}`;

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "launcher right";
  launcher.innerHTML = CHAT_ICON;
  launcher.setAttribute("aria-label", "Open chat");
  launcher.setAttribute("aria-expanded", "false");

  shadow.append(style, frame, launcher);
  document.body.append(root);

  let open = false;

  function post(message: HostToWidget) {
    frame.contentWindow?.postMessage(message, appOrigin);
  }

  function pageContext() {
    return { page: window.location.href, referrer: document.referrer };
  }

  function setOpen(next: boolean) {
    open = next;
    frame.dataset["open"] = String(open);
    launcher.dataset["open"] = String(open);
    launcher.innerHTML = open ? CLOSE_ICON : CHAT_ICON;
    launcher.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      post({ type: "supportdesk:open", ...pageContext() });
      frame.focus();
    } else {
      launcher.focus();
    }
  }

  function place(position: WidgetPlacement) {
    const side = position === "bottom-left" ? "left" : "right";
    frame.className = `frame ${side}`;
    launcher.className = `launcher ${side}`;
  }

  launcher.addEventListener("click", () => setOpen(!open));

  window.addEventListener("message", (event) => {
    if (event.origin !== appOrigin || event.source !== frame.contentWindow) {
      return;
    }
    const message = parseWidgetToHost(event.data);
    if (!message) return;
    switch (message.type) {
      case "supportdesk:ready":
        place(message.position);
        launcher.style.backgroundColor = message.accentHex;
        launcher.dataset["ready"] = "true";
        post({ type: "supportdesk:context", ...pageContext() });
        break;
      case "supportdesk:close":
        if (open) setOpen(false);
        break;
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) setOpen(false);
  });
}

start();
