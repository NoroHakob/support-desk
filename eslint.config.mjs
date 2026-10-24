import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    settings: {
      next: { rootDir: "apps/web/" },
    },
  },
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/.wrangler/**",
    "**/next-env.d.ts",
    "packages/db/src/prisma/contract.d.ts",
    "packages/db/src/prisma/contract.json",
    "packages/db/migrations/**",
    "apps/web/public/embed.js",
  ]),
]);
