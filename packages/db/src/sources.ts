import { db } from "./prisma/db";

export async function listSources(workspaceId: string) {
  return db.orm.public.Source.select(
    "id",
    "kind",
    "name",
    "mime",
    "size",
    "status",
    "error",
    "createdAt",
    "updatedAt",
  )
    .where({ workspaceId })
    .orderBy((source) => source.createdAt.desc())
    .all();
}

/** The agent is on while the knowledge base has a ready source (PRD AI-1). */
export async function hasReadySource(workspaceId: string) {
  const ready = await db.orm.public.Source.select("id")
    .where({ workspaceId, status: "ready" })
    .first();
  return ready !== null;
}
