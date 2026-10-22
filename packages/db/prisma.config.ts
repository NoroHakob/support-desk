import { resolve } from "node:path";

import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { config } from "dotenv";

// The monorepo keeps one env file in apps/web. Migrations use the direct
// (unpooled) connection; the app runtime uses the pooled DATABASE_URL.
config({
  path: resolve(import.meta.dirname, "../../apps/web/.env.local"),
  quiet: true,
});

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: { connection: process.env["DATABASE_URL_UNPOOLED"] },
  }),
});
