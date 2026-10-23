import { defaultAgentName } from "@marshaldesk/shared";

import { isUniqueViolation } from "./errors";
import { db } from "./prisma/db";

export async function findMembershipByUserId(userId: string) {
  return db.orm.public.Member.select(
    "id",
    "workspaceId",
    "role",
    "name",
    "imageUrl",
  )
    .where({ userId })
    .first();
}

export async function updateMemberProfile(
  memberId: string,
  profile: { name: string; imageUrl: string | null },
) {
  return db.orm.public.Member.where({ id: memberId })
    .select("id")
    .update(profile);
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
      ).create({ name, agentName: defaultAgentName(name) });
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
