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
