import { db } from "./prisma/db";

export type VisitorDetailsUpdate = {
  country: string | null;
  city: string | null;
  timezone: string | null;
  language: string | null;
  device: "desktop" | "mobile" | "tablet" | null;
  browser: string | null;
  os: string | null;
  page: string | null;
  referrer: string | null;
};

export async function findVisitor(workspaceId: string, visitorId: string) {
  return db.orm.public.Visitor.select(
    "id",
    "tokenSecretHash",
    "visitCount",
    "lastSeenAt",
  )
    .where({ id: visitorId, workspaceId })
    .first();
}

export async function createVisitor({
  workspaceId,
  tokenSecretHash,
  details,
  now,
}: {
  workspaceId: string;
  tokenSecretHash: string;
  details: VisitorDetailsUpdate;
  now: Date;
}) {
  return db.orm.public.Visitor.select("id").create({
    workspaceId,
    tokenSecretHash,
    ...details,
    visitCount: 1,
    lastSeenAt: now,
  });
}

export async function recordVisit({
  workspaceId,
  visitorId,
  details,
  visitCount,
  now,
}: {
  workspaceId: string;
  visitorId: string;
  details: VisitorDetailsUpdate;
  visitCount: number;
  now: Date;
}) {
  return db.orm.public.Visitor.where({ id: visitorId, workspaceId })
    .select("id")
    .update({ ...details, visitCount, lastSeenAt: now });
}
