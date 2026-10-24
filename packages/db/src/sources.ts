import { db } from "./prisma/db";
import { isUniqueViolation } from "./errors";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const sourceFields = [
  "id",
  "kind",
  "name",
  "mime",
  "size",
  "status",
  "error",
  "createdAt",
  "updatedAt",
] as const;

type SourceRow = {
  id: string;
  kind: "file" | "text";
  name: string;
  mime: string | null;
  size: number | null;
  status: "uploaded" | "processing" | "ready" | "failed";
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

async function chunkCounts(workspaceId: string, sourceIds: string[]) {
  if (sourceIds.length === 0) {
    return new Map<string, number>();
  }
  const rows = await db.orm.public.Chunk.where({ workspaceId })
    .where((chunk) => chunk.sourceId.in(sourceIds))
    .groupBy("sourceId")
    .aggregate((aggregate) => ({ count: aggregate.count() }));
  return new Map(rows.map((row) => [row.sourceId, Number(row.count)]));
}

async function withChunkCounts(workspaceId: string, rows: SourceRow[]) {
  const counts = await chunkCounts(
    workspaceId,
    rows.map((row) => row.id),
  );
  return rows.map((row) => ({ ...row, chunkCount: counts.get(row.id) ?? 0 }));
}

export async function listSources(workspaceId: string) {
  const rows = await db.orm.public.Source.select(...sourceFields)
    .where({ workspaceId })
    .orderBy((source) => source.createdAt.desc())
    .all();
  return withChunkCounts(workspaceId, rows);
}

/** One source with its chunk count, or null when it isn't the workspace's. */
export async function findSource(workspaceId: string, sourceId: string) {
  const row = await db.orm.public.Source.select(...sourceFields)
    .where({ id: sourceId, workspaceId })
    .first();
  if (!row) {
    return null;
  }
  const [source] = await withChunkCounts(workspaceId, [row]);
  return source ?? null;
}

export async function findSourceDetail(workspaceId: string, sourceId: string) {
  const [source, row, chunks] = await Promise.all([
    findSource(workspaceId, sourceId),
    db.orm.public.Source.select("text")
      .where({ id: sourceId, workspaceId })
      .first(),
    db.orm.public.Chunk.select("id", "position", "content")
      .where({ workspaceId, sourceId })
      .orderBy((chunk) => chunk.position.asc())
      .all(),
  ]);
  return source ? { source, text: row?.text ?? null, chunks } : null;
}

/**
 * The agent is on while the knowledge base has something to answer from
 * (PRD AI-1). A source being reprocessed keeps answering from its previous
 * chunks, so this checks chunks rather than statuses.
 */
export async function hasKnowledge(workspaceId: string) {
  const chunk = await db.orm.public.Chunk.select("id")
    .where({ workspaceId })
    .first();
  return chunk !== null;
}

async function saveFileSourceOnce({
  workspaceId,
  name,
  mime,
  size,
  extension,
}: {
  workspaceId: string;
  name: string;
  mime: string;
  size: number;
  extension: string;
}) {
  return db.transaction(async (tx) => {
    const existing = await tx.orm.public.Source.select("id")
      .where({ workspaceId, name, kind: "file" })
      .forNoKeyUpdate()
      .first();
    const id =
      existing?.id ??
      (
        await tx.orm.public.Source.select("id").create({
          workspaceId,
          kind: "file",
          name,
        })
      ).id;
    const storageKey = `workspaces/${workspaceId}/sources/${id}.${extension}`;
    await tx.orm.public.Source.where({ id, workspaceId })
      .select("id")
      .update({ mime, size, storageKey, status: "uploaded", error: null });
    return { id, storageKey };
  });
}

/**
 * Creates the source for a file upload, or reuses the one with the same name
 * so the new file replaces it (PRD K-5). Its chunks keep answering until the
 * new file is processed.
 */
export async function saveFileSource(
  input: Parameters<typeof saveFileSourceOnce>[0],
) {
  try {
    return await saveFileSourceOnce(input);
  } catch (error) {
    // Two uploads with the same name raced; the other one created the row.
    if (isUniqueViolation(error)) {
      return saveFileSourceOnce(input);
    }
    throw error;
  }
}

export async function createTextSource(
  workspaceId: string,
  { name, text }: { name: string; text: string },
) {
  const row = await db.orm.public.Source.select("id").create({
    workspaceId,
    kind: "text",
    name,
    text,
    size: new TextEncoder().encode(text).length,
  });
  return row.id;
}

/** Returns false when there's no such text source in the workspace. */
export async function updateTextSource(
  workspaceId: string,
  sourceId: string,
  { name, text }: { name: string; text: string },
) {
  const row = await db.orm.public.Source.where({
    id: sourceId,
    workspaceId,
    kind: "text",
  })
    .select("id")
    .update({
      name,
      text,
      size: new TextEncoder().encode(text).length,
      status: "uploaded",
      error: null,
    });
  return row !== null;
}

async function bumpKnowledgeVersion(tx: Tx, workspaceId: string) {
  const workspace = await tx.orm.public.Workspace.select("knowledgeVersion")
    .where({ id: workspaceId })
    .forUpdate()
    .first();
  if (workspace) {
    await tx.orm.public.Workspace.where({ id: workspaceId })
      .select("id")
      .update({ knowledgeVersion: workspace.knowledgeVersion + 1 });
  }
}

/**
 * Deletes a source and, through the foreign key, its chunks, so the agent
 * stops using them right away (PRD K-4). Returns the file's storage key.
 */
export async function deleteSource(workspaceId: string, sourceId: string) {
  return db.transaction(async (tx) => {
    const deleted = await tx.orm.public.Source.where({
      id: sourceId,
      workspaceId,
    })
      .select("storageKey")
      .delete();
    if (!deleted) {
      return null;
    }
    await bumpKnowledgeVersion(tx, workspaceId);
    return { storageKey: deleted.storageKey };
  });
}

/** The source a stored file belongs to, matched by its exact key. */
export async function findSourceByStorageKey(
  workspaceId: string,
  sourceId: string,
  storageKey: string,
) {
  return db.orm.public.Source.select("id", "status", "etag")
    .where({ id: sourceId, workspaceId, storageKey, kind: "file" })
    .first();
}

async function sourceHasChunks(tx: Tx, workspaceId: string, sourceId: string) {
  const chunk = await tx.orm.public.Chunk.select("id")
    .where({ workspaceId, sourceId })
    .first();
  return chunk !== null;
}

/**
 * Starts an ingest run: claims the next revision and reads the source after
 * claiming, so a later run always sees the latest file or text.
 */
export async function claimIngest(workspaceId: string, sourceId: string) {
  return db.transaction(async (tx) => {
    const source = await tx.orm.public.Source.select(
      "revision",
      "kind",
      "name",
      "storageKey",
      "text",
    )
      .where({ id: sourceId, workspaceId })
      .forNoKeyUpdate()
      .first();
    if (!source) {
      return null;
    }
    const revision = source.revision + 1;
    await tx.orm.public.Source.where({ id: sourceId, workspaceId })
      .select("id")
      .update({ revision, status: "processing", error: null });
    return { ...source, revision };
  });
}

/**
 * Swaps in the new chunks if this run's revision is still the latest.
 * Returns false when a newer run took over.
 */
export async function finishIngest({
  workspaceId,
  sourceId,
  revision,
  etag,
  chunks,
}: {
  workspaceId: string;
  sourceId: string;
  revision: number;
  etag: string | null;
  chunks: { content: string; embedding: number[] }[];
}) {
  return db.transaction(async (tx) => {
    const source = await tx.orm.public.Source.select("revision")
      .where({ id: sourceId, workspaceId })
      .forNoKeyUpdate()
      .first();
    if (!source || source.revision !== revision) {
      return false;
    }
    await tx.orm.public.Chunk.where({ workspaceId, sourceId }).deleteAndCount();
    if (chunks.length > 0) {
      await tx.orm.public.Chunk.createAndCount(
        chunks.map((chunk, position) => ({
          workspaceId,
          sourceId,
          position,
          content: chunk.content,
          embedding: chunk.embedding,
        })),
      );
    }
    await tx.orm.public.Source.where({ id: sourceId, workspaceId })
      .select("id")
      .update({ status: "ready", error: null, etag });
    await bumpKnowledgeVersion(tx, workspaceId);
    return true;
  });
}

/**
 * Records a failed run. A source with chunks from an earlier version keeps
 * answering, so it stays `ready` with the reason; one without becomes
 * `failed`. Pass `revision` to skip the update when a newer run took over.
 */
export async function failIngest({
  workspaceId,
  sourceId,
  revision,
  error,
}: {
  workspaceId: string;
  sourceId: string;
  revision: number | null;
  error: string;
}) {
  return db.transaction(async (tx) => {
    const source = await tx.orm.public.Source.select("revision")
      .where({ id: sourceId, workspaceId })
      .forNoKeyUpdate()
      .first();
    if (!source || (revision !== null && source.revision !== revision)) {
      return false;
    }
    const keepsAnswering = await sourceHasChunks(tx, workspaceId, sourceId);
    await tx.orm.public.Source.where({ id: sourceId, workspaceId })
      .select("id")
      .update({ status: keepsAnswering ? "ready" : "failed", error });
    return true;
  });
}

/** For a repeated upload of the file the chunks already came from. */
export async function markSourceReady(workspaceId: string, sourceId: string) {
  await db.orm.public.Source.where({ id: sourceId, workspaceId })
    .select("id")
    .update({ status: "ready", error: null });
}

/** Whether any source in the workspace is still waiting to be processed. */
export async function hasPendingSources(workspaceId: string) {
  const pending = await db.orm.public.Source.select("id")
    .where({ workspaceId })
    .where((source) => source.status.in(["uploaded", "processing"]))
    .first();
  return pending !== null;
}

/** Sources in every workspace that have been waiting since before `before`. */
export async function listStuckSources(before: Date) {
  return db.orm.public.Source.select("id", "workspaceId", "kind", "status")
    .where((source) => source.status.in(["uploaded", "processing"]))
    .where((source) => source.updatedAt.lt(before))
    .limit(100)
    .all();
}
