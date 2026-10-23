import * as z from "zod";

export const SOURCE_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const sourceFileTypes = [
  { extension: "pdf", mime: "application/pdf" },
  { extension: "md", mime: "text/markdown" },
  { extension: "txt", mime: "text/plain" },
] as const;

export const sourceKindSchema = z.enum(["file", "text"]);
export const sourceStatusSchema = z.enum([
  "uploaded",
  "processing",
  "ready",
  "failed",
]);

export const sourceSchema = z.object({
  id: z.uuid(),
  kind: sourceKindSchema,
  name: z.string(),
  mime: z.string().nullable(),
  size: z.number().int().nullable(),
  status: sourceStatusSchema,
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SourceKind = z.infer<typeof sourceKindSchema>;
export type SourceStatus = z.infer<typeof sourceStatusSchema>;
export type Source = z.infer<typeof sourceSchema>;
