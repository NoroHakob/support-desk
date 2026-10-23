import * as z from "zod";

export const AGENT_NAME_MAX_LENGTH = 60;
export const GREETING_MAX_LENGTH = 500;
export const SUGGESTED_QUESTIONS_MAX = 4;
export const AGENT_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const DEFAULT_GREETING = "Hi there! How can we help you today?";

export function defaultAgentName(workspaceName: string) {
  return `${workspaceName} Agent`;
}

export const imageFileTypes = [
  { extension: "png", mime: "image/png" },
  { extension: "jpg", mime: "image/jpeg" },
  { extension: "jpeg", mime: "image/jpeg" },
  { extension: "gif", mime: "image/gif" },
  { extension: "webp", mime: "image/webp" },
] as const;

export const imageMimeSchema = z.enum([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export const widgetPositionSchema = z.enum(["bottom-left", "bottom-right"]);

export const widgetColorSchema = z.enum([
  "blue",
  "indigo",
  "violet",
  "pink",
  "red",
  "orange",
  "green",
]);

// Every accent keeps white text at WCAG AA (4.5:1), which is why pink,
// orange and green use their 700 shades.
export const widgetColorHex = {
  blue: "#2563eb",
  indigo: "#4f46e5",
  violet: "#7c3aed",
  pink: "#be185d",
  red: "#dc2626",
  orange: "#c2410c",
  green: "#15803d",
} as const satisfies Record<WidgetColor, string>;

export const DEFAULT_WIDGET_COLOR: WidgetColor = "blue";

export const agentNameSchema = z
  .string()
  .trim()
  .min(1, "Give your agent a name.")
  .max(
    AGENT_NAME_MAX_LENGTH,
    `Use at most ${AGENT_NAME_MAX_LENGTH} characters.`,
  );

export const greetingSchema = z
  .string()
  .trim()
  .min(1, "Write a greeting.")
  .max(GREETING_MAX_LENGTH, `Use at most ${GREETING_MAX_LENGTH} characters.`);

export const allowedDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(?=.{1,253}$)(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/,
    "Enter a domain like example.com, without https://.",
  );

export const widgetSettingsInputSchema = z.object({
  position: widgetPositionSchema,
  color: widgetColorSchema,
  agentName: agentNameSchema,
  greeting: greetingSchema,
  allowedDomains: z.array(allowedDomainSchema),
});

export const widgetSettingsSchema = widgetSettingsInputSchema.extend({
  agentAvatarUrl: z.string().nullable(),
  suggestedQuestions: z.array(z.string()).max(SUGGESTED_QUESTIONS_MAX),
  snippetInstalled: z.boolean(),
});

export const createAvatarUploadInputSchema = z.object({
  mime: imageMimeSchema,
  size: z
    .number()
    .int()
    .positive()
    .max(AGENT_AVATAR_MAX_BYTES, "Use an image up to 2 MB."),
});

export const avatarUploadSchema = z.object({
  key: z.string(),
  url: z.url(),
  // Sent with the PUT exactly as given, because the URL signs them.
  headers: z.record(z.string(), z.string()),
});

export const confirmAvatarUploadInputSchema = z.object({
  key: z.string().min(1),
});

export type WidgetPosition = z.infer<typeof widgetPositionSchema>;
export type WidgetColor = z.infer<typeof widgetColorSchema>;
export type WidgetSettingsInput = z.infer<typeof widgetSettingsInputSchema>;
export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;
export type ImageMime = z.infer<typeof imageMimeSchema>;
export type CreateAvatarUploadInput = z.infer<
  typeof createAvatarUploadInputSchema
>;
export type AvatarUpload = z.infer<typeof avatarUploadSchema>;
