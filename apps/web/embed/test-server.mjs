// A stand-in customer website for trying the embed snippet locally.
//   pnpm --filter @marshaldesk/web embed:test   →   http://localhost:4000
// Paste the snippet from the dashboard's Install section and load it. The
// snippet is remembered, so reloading the page reloads the widget too.

import { createServer } from "node:http";

const PORT = Number(process.env["PORT"] ?? 4000);

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Embed test page</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; margin: 0; color: #18181b; background: #fafafa; }
  main { max-width: 640px; margin: 0 auto; padding: 32px 16px 160px; }
  textarea { width: 100%; box-sizing: border-box; min-height: 120px; font: 13px ui-monospace, monospace; padding: 10px; border: 1px solid #d4d4d8; border-radius: 8px; }
  button { font: inherit; padding: 6px 14px; border-radius: 8px; border: 1px solid #d4d4d8; background: #fff; cursor: pointer; }
  .row { display: flex; gap: 8px; margin-top: 8px; }
  .status { color: #52525b; }
  .block { height: 14px; background: #e4e4e7; border-radius: 4px; margin: 10px 0; }
</style>
</head>
<body>
<main>
  <h1>Embed test page</h1>
  <p>Paste the snippet from your dashboard (Home → Install), then load it.</p>
  <textarea id="snippet" spellcheck="false" placeholder='<script src="http://localhost:3000/embed.js" data-workspace="…" async></script>'></textarea>
  <div class="row">
    <button id="load" type="button">Load the widget</button>
    <button id="clear" type="button">Forget the snippet</button>
  </div>
  <p class="status" id="status"></p>
  <div class="block"></div><div class="block" style="width: 80%"></div><div class="block" style="width: 60%"></div>
</main>
<script>
  const KEY = "embed-test-snippet";
  const textarea = document.getElementById("snippet");
  const status = document.getElementById("status");

  function load(snippet) {
    const parsed = new DOMParser().parseFromString(snippet, "text/html").querySelector("script[src]");
    if (!parsed) { status.textContent = "That doesn't look like the snippet: no script with a src."; return; }
    // Scripts added through innerHTML don't run, so copy it into a new element.
    const script = document.createElement("script");
    for (const { name, value } of parsed.attributes) script.setAttribute(name, value);
    document.body.append(script);
    localStorage.setItem(KEY, snippet);
    status.textContent = "Snippet loaded. The launcher appears in a corner once the widget is ready. Reload this page to load it again.";
    document.getElementById("load").disabled = true;
  }

  document.getElementById("load").addEventListener("click", () => load(textarea.value.trim()));
  document.getElementById("clear").addEventListener("click", () => { localStorage.removeItem(KEY); location.reload(); });

  const saved = localStorage.getItem(KEY);
  if (saved) { textarea.value = saved; load(saved); }
</script>
</body>
</html>`;

createServer((request, response) => {
  if (request.url !== "/" && request.url !== "/index.html") {
    response.writeHead(404).end("Not found");
    return;
  }
  response
    .writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    })
    .end(page);
}).listen(PORT, () => {
  console.log(`Embed test page on http://localhost:${PORT}`);
});
