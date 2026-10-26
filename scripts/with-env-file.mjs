// Runs a command with ENV_FILE set, so prisma.config.ts and storage-cors.ts
// read another env file (such as apps/web/.env.prod). pnpm runs scripts with
// cmd.exe on Windows, where `ENV_FILE=... command` doesn't work.
//
//   node scripts/with-env-file.mjs <file> <command> [args...]
//
// The file path is relative to the repo root. The command runs through the
// shell (pnpm is a .cmd on Windows), so its arguments can't contain spaces.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const [file, command, ...args] = process.argv.slice(2);
if (!file || !command) {
  console.error("Usage: node scripts/with-env-file.mjs <file> <command>");
  process.exit(1);
}
if (!existsSync(resolve(import.meta.dirname, "..", file))) {
  console.error(`${file} doesn't exist yet.`);
  process.exit(1);
}

const result = spawnSync([command, ...args].join(" "), {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ENV_FILE: file },
});
process.exit(result.status ?? 1);
