import pgvector from "@prisma/orm-extension-pgvector/runtime";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";

import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

function createDb() {
  return postgres({
    contract,
    url: process.env["DATABASE_URL"],
    extensions: [pgvector],
  });
}

declare global {
  var __supportDeskDb: ReturnType<typeof createDb> | undefined;
}

// Reuse one pool across Next.js dev reloads.
export const db = (globalThis.__supportDeskDb ??= createDb());
