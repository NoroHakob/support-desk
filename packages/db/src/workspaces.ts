import { db } from "./prisma/db";

export async function findMembershipByUserId(userId: string) {
  return db.orm.public.Member.select("id", "workspaceId", "role")
    .where({ userId })
    .first();
}

export async function findWorkspaceByUserId(userId: string) {
  const membership = await findMembershipByUserId(userId);
  if (!membership) {
    return null;
  }
  return db.orm.public.Workspace.select("id", "name")
    .where({ id: membership.workspaceId })
    .first();
}

/** Returns null when the user already belongs to a workspace (PRD A-2). */
export async function createWorkspaceWithOwner({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  try {
    return await db.transaction(async (tx) => {
      const workspace = await tx.orm.public.Workspace.select(
        "id",
        "name",
      ).create({ name });
      await tx.orm.public.Member.create({
        workspaceId: workspace.id,
        userId,
        role: "owner",
      });
      return workspace;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return null;
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  let current = error;
  while (typeof current === "object" && current !== null) {
    if (
      ("sqlState" in current && current.sqlState === "23505") ||
      ("code" in current && current.code === "23505")
    ) {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}
