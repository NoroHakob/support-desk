import type { WidgetColor, WidgetPosition } from "@marshaldesk/shared";

import { db } from "./prisma/db";

const widgetSettingsFields = [
  "widgetPosition",
  "widgetColor",
  "agentName",
  "agentAvatarKey",
  "greeting",
  "allowedDomains",
  "suggestedQuestions",
  "snippetInstalledAt",
] as const;

export type WidgetSettingsUpdate = {
  widgetPosition: WidgetPosition;
  widgetColor: WidgetColor;
  agentName: string;
  greeting: string;
  allowedDomains: string[];
};

export async function findWidgetSettings(workspaceId: string) {
  return db.orm.public.Workspace.select(...widgetSettingsFields)
    .where({ id: workspaceId })
    .first();
}

export async function updateWidgetSettings(
  workspaceId: string,
  settings: WidgetSettingsUpdate,
) {
  return db.orm.public.Workspace.where({ id: workspaceId })
    .select(...widgetSettingsFields)
    .update(settings);
}

/** Returns the saved settings and the avatar key they replaced. */
export async function setAgentAvatarKey(
  workspaceId: string,
  agentAvatarKey: string | null,
) {
  return db.transaction(async (tx) => {
    const current = await tx.orm.public.Workspace.select("agentAvatarKey")
      .where({ id: workspaceId })
      .forUpdate()
      .first();
    if (!current) {
      return null;
    }
    const settings = await tx.orm.public.Workspace.where({ id: workspaceId })
      .select(...widgetSettingsFields)
      .update({ agentAvatarKey });
    return settings ? { settings, previousKey: current.agentAvatarKey } : null;
  });
}
