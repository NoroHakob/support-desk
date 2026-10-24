import { db } from "./prisma/db";

/**
 * Claims a suggested-question regeneration. Returns null while sources are
 * still processing (the last one to finish regenerates) or when the questions
 * already match the knowledge base, so a batch of changes costs one call.
 */
export async function claimSuggestedQuestions(workspaceId: string) {
  return db.transaction(async (tx) => {
    const workspace = await tx.orm.public.Workspace.select(
      "knowledgeVersion",
      "suggestedQuestionsVersion",
    )
      .where({ id: workspaceId })
      .forUpdate()
      .first();
    if (
      !workspace ||
      workspace.suggestedQuestionsVersion >= workspace.knowledgeVersion
    ) {
      return null;
    }
    const pending = await tx.orm.public.Source.select("id")
      .where({ workspaceId })
      .where((source) => source.status.in(["uploaded", "processing"]))
      .first();
    if (pending) {
      return null;
    }
    await tx.orm.public.Workspace.where({ id: workspaceId })
      .select("id")
      .update({ suggestedQuestionsVersion: workspace.knowledgeVersion });
    return {
      version: workspace.knowledgeVersion,
      previousVersion: workspace.suggestedQuestionsVersion,
    };
  });
}

/**
 * Gives a claim back after a failed generation, so the schedule picks the
 * workspace up again. Does nothing when a newer claim has happened since.
 */
export async function releaseSuggestedQuestions(
  workspaceId: string,
  claim: { version: number; previousVersion: number },
) {
  await db.orm.public.Workspace.where({
    id: workspaceId,
    suggestedQuestionsVersion: claim.version,
  })
    .select("id")
    .update({ suggestedQuestionsVersion: claim.previousVersion });
}

/**
 * Saves questions generated from `version` of the knowledge base. Returns
 * false when the knowledge base changed in the meantime; that change claims
 * its own regeneration.
 */
export async function saveSuggestedQuestions(
  workspaceId: string,
  version: number,
  suggestedQuestions: string[],
) {
  const row = await db.orm.public.Workspace.where({
    id: workspaceId,
    knowledgeVersion: version,
  })
    .select("id")
    .update({ suggestedQuestions });
  return row !== null;
}

/** Workspaces whose suggested questions are behind their knowledge base. */
export async function listWorkspacesNeedingQuestions() {
  const rows = await db.orm.public.Workspace.select("id")
    .where((workspace) =>
      workspace.suggestedQuestionsVersion.lt(workspace.knowledgeVersion),
    )
    .limit(100)
    .all();
  return rows.map((row) => row.id);
}

/** The opening chunks of each source, as material for suggested questions. */
export async function listKnowledgeSample(
  workspaceId: string,
  chunksPerSource: number,
) {
  const rows = await db.orm.public.Chunk.select("content")
    .where({ workspaceId })
    .where((chunk) => chunk.position.lt(chunksPerSource))
    .orderBy((chunk) => chunk.sourceId.asc())
    .orderBy((chunk) => chunk.position.asc())
    .all();
  return rows.map((row) => row.content);
}
