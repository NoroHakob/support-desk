// Bundles the embed script to public/embed.js (git-ignored).
//   node embed/build.mjs           one build
//   node embed/build.mjs --watch   rebuild on change

import { fileURLToPath } from "node:url";

import * as esbuild from "esbuild";

const options = {
  entryPoints: [fileURLToPath(new URL("./embed.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("../public/embed.js", import.meta.url)),
  bundle: true,
  format: "iife",
  target: "es2019",
  minify: true,
  legalComments: "none",
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
