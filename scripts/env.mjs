// Writes keys into env files without ever printing their values.
//
//   pnpm env:set KEY VALUE [--file <path>]
//   pnpm env:secret KEY [--file <path>] [--also <path>]... [--rotate]
//
// Paths are relative to the repo root; the default file is apps/web/.env.local.
// `secret` generates 32 random bytes (base64url). It keeps a value that already
// exists in the first file, copying it to the --also files, unless --rotate.

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_FILE = "apps/web/.env.local";
const KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const files = [];
  const also = [];
  let rotate = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--file" || arg === "--also") {
      const value = argv[++index];
      if (!value) fail(`${arg} needs a path.`);
      (arg === "--file" ? files : also).push(value);
    } else if (arg === "--rotate") {
      rotate = true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, files, also, rotate };
}

function readLines(path) {
  if (!existsSync(path)) return { lines: [], eol: "\n" };
  const text = readFileSync(path, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  return { lines, eol };
}

function readValue(path, key) {
  const line = readLines(path).lines.find((item) => item.startsWith(`${key}=`));
  return line === undefined ? undefined : line.slice(key.length + 1);
}

function writeValue(path, key, value) {
  const { lines, eol } = readLines(path);
  const index = lines.findIndex((item) => item.startsWith(`${key}=`));
  const entry = `${key}=${value}`;
  if (index === -1) lines.push(entry);
  else lines[index] = entry;
  writeFileSync(path, lines.join(eol) + eol, "utf8");
}

const [command, ...rest] = process.argv.slice(2);
const { positional, files, also, rotate } = parseArgs(rest);
const [key, value] = positional;

if (!key || !KEY_PATTERN.test(key)) fail("Pass a key like MY_SECRET.");

const targets = [...(files.length > 0 ? files : [DEFAULT_FILE]), ...also].map(
  (path) => resolve(ROOT, path),
);

switch (command) {
  case "set": {
    if (value === undefined) fail("Pass a value: pnpm env:set KEY VALUE");
    for (const path of targets) writeValue(path, key, value);
    console.log(`Set ${key} in ${targets.length} file(s).`);
    break;
  }
  case "secret": {
    const existing = rotate ? undefined : readValue(targets[0], key);
    const secret = existing || randomBytes(32).toString("base64url");
    for (const path of targets) writeValue(path, key, secret);
    console.log(
      `${existing ? "Kept" : "Generated"} ${key} in ${targets.length} file(s). The value isn't shown.`,
    );
    break;
  }
  default:
    fail("Use `set` or `secret`.");
}
