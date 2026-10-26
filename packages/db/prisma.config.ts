import { resolve } from "node:path";

import { definePrismaConfig } from "@prisma/cli-engine";
import pgvector from "@prisma/orm-extension-pgvector/control";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { config } from "dotenv";

// The monorepo keeps its env files in apps/web: .env.local for development,
// or ENV_FILE (relative to the repo root) such as apps/web/.env.prod for
// production. Migrations use the direct (unpooled) connection; the app
// runtime uses the pooled DATABASE_URL.
config({
  path: resolve(
    import.meta.dirname,
    "../..",
    process.env["ENV_FILE"] ?? "apps/web/.env.local",
  ),
  quiet: true,
});

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    extensions: [pgvector],
    db: { connection: process.env["DATABASE_URL_UNPOOLED"] },
  }),
});
