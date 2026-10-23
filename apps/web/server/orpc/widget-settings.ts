import {
  findWidgetSettings,
  setAgentAvatarKey,
  updateWidgetSettings,
} from "@marshaldesk/db";
import {
  AGENT_AVATAR_MAX_BYTES,
  assertNever,
  imageMimeSchema,
  type ImageMime,
  type WidgetSettings,
} from "@marshaldesk/shared";
import { ORPCError } from "@orpc/server";

import { ownerProcedure } from "@/server/orpc/base";
import {
  deleteProfileImage,
  headProfileImage,
  presignProfileImagePut,
  profileImageUrl,
} from "@/server/storage";

const AVATAR_UPLOAD_EXPIRES_IN_SECONDS = 2 * 60;
// Safe to cache forever because every upload gets a new key.
const AVATAR_CACHE_CONTROL = "public, max-age=31536000, immutable";
const AVATAR_FILE_PATTERN = /^[0-9a-f-]{36}\.(png|jpg|gif|webp)$/;

export type WidgetSettingsRow = NonNullable<
  Awaited<ReturnType<typeof findWidgetSettings>>
>;

export function toWidgetSettings(row: WidgetSettingsRow): WidgetSettings {
  return {
    position: row.widgetPosition,
    color: row.widgetColor,
    agentName: row.agentName,
    agentAvatarUrl: row.agentAvatarKey
      ? profileImageUrl(row.agentAvatarKey)
      : null,
    greeting: row.greeting,
    allowedDomains: [...row.allowedDomains],
    suggestedQuestions: [...row.suggestedQuestions],
    snippetInstalled: row.snippetInstalledAt !== null,
  };
}

function avatarKeyPrefix(workspaceId: string) {
  return `workspaces/${workspaceId}/agent-avatar/`;
}

function imageExtension(mime: ImageMime) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return assertNever(mime);
  }
}

async function deleteReplacedAvatar(key: string | null) {
  if (!key) {
    return;
  }
  try {
    await deleteProfileImage(key);
  } catch (error) {
    console.error(`Couldn't delete the replaced avatar ${key}.`, error);
  }
}

export const widgetSettings = {
  get: ownerProcedure.widgetSettings.get.handler(async ({ context }) => {
    const row = await findWidgetSettings(context.workspaceId);
    if (!row) {
      throw new ORPCError("NOT_FOUND");
    }
    return toWidgetSettings(row);
  }),

  update: ownerProcedure.widgetSettings.update.handler(
    async ({ context, input }) => {
      const row = await updateWidgetSettings(context.workspaceId, {
        widgetPosition: input.position,
        widgetColor: input.color,
        agentName: input.agentName,
        greeting: input.greeting,
        allowedDomains: [...new Set(input.allowedDomains)],
      });
      if (!row) {
        throw new ORPCError("NOT_FOUND");
      }
      return toWidgetSettings(row);
    },
  ),

  createAvatarUpload: ownerProcedure.widgetSettings.createAvatarUpload.handler(
    async ({ context, input }) => {
      const key = `${avatarKeyPrefix(context.workspaceId)}${crypto.randomUUID()}.${imageExtension(input.mime)}`;
      const upload = await presignProfileImagePut({
        key,
        contentType: input.mime,
        cacheControl: AVATAR_CACHE_CONTROL,
        expiresIn: AVATAR_UPLOAD_EXPIRES_IN_SECONDS,
      });
      return { key, ...upload };
    },
  ),

  confirmAvatarUpload:
    ownerProcedure.widgetSettings.confirmAvatarUpload.handler(
      async ({ context, input, errors }) => {
        const prefix = avatarKeyPrefix(context.workspaceId);
        if (
          !input.key.startsWith(prefix) ||
          !AVATAR_FILE_PATTERN.test(input.key.slice(prefix.length))
        ) {
          throw errors.BAD_REQUEST();
        }

        // A presigned PUT can't limit the size, so this is the real check.
        const object = await headProfileImage(input.key);
        if (!object) {
          throw errors.BAD_REQUEST({
            message: "We couldn't find that upload. Try again.",
          });
        }
        if (
          object.size > AGENT_AVATAR_MAX_BYTES ||
          !imageMimeSchema.safeParse(object.contentType).success
        ) {
          await deleteReplacedAvatar(input.key);
          throw errors.BAD_REQUEST({
            message: "Use a PNG, JPEG, GIF or WebP image up to 2 MB.",
          });
        }

        const result = await setAgentAvatarKey(context.workspaceId, input.key);
        if (!result) {
          throw new ORPCError("NOT_FOUND");
        }
        if (result.previousKey !== input.key) {
          await deleteReplacedAvatar(result.previousKey);
        }
        return toWidgetSettings(result.settings);
      },
    ),

  removeAvatar: ownerProcedure.widgetSettings.removeAvatar.handler(
    async ({ context }) => {
      const result = await setAgentAvatarKey(context.workspaceId, null);
      if (!result) {
        throw new ORPCError("NOT_FOUND");
      }
      await deleteReplacedAvatar(result.previousKey);
      return toWidgetSettings(result.settings);
    },
  ),
};
