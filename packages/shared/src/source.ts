import * as z from "zod";

export const SOURCE_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const SOURCE_NAME_MAX_LENGTH = 200;
export const TEXT_SOURCE_MAX_LENGTH = 50_000;
export const UPLOAD_UNFINISHED_ERROR =
  "The upload didn't finish. Try uploading the file again.";

export const sourceFileTypes = [
  { extension: "pdf", mime: "application/pdf" },
  { extension: "md", mime: "text/markdown" },
  { extension: "txt", mime: "text/plain" },
] as const;

export type SourceFileType = (typeof sourceFileTypes)[number];

/** The file type for a file name, by its extension. */
export function sourceFileType(name: string): SourceFileType | null {
  const extension = name.includes(".")
    ? name.split(".").pop()?.toLowerCase()
    : undefined;
  return sourceFileTypes.find((type) => type.extension === extension) ?? null;
}

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
  // Set when processing failed. A source that still has chunks from an
  // earlier version keeps answering and stays `ready`.
  error: z.string().nullable(),
  chunkCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const chunkSchema = z.object({
  id: z.uuid(),
  position: z.number().int(),
  content: z.string(),
});

export const sourceDetailSchema = z.object({
  source: sourceSchema,
  // The text of a text source, for editing.
  text: z.string().nullable(),
  chunks: z.array(chunkSchema),
});

export const sourceIdInputSchema = z.object({ id: z.uuid() });

export const createSourceUploadInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(SOURCE_NAME_MAX_LENGTH, "Use a shorter file name.")
    .refine((name) => sourceFileType(name) !== null, {
      message: "Use a PDF, Markdown or text file.",
    }),
  size: z
    .number()
    .int()
    .positive("This file is empty.")
    .max(SOURCE_FILE_MAX_BYTES, "Use a file up to 10 MB."),
});

export const sourceUploadSchema = z.object({
  source: sourceSchema,
  url: z.url(),
  // Sent with the PUT exactly as given, because the URL signs them.
  headers: z.record(z.string(), z.string()),
});

export const textSourceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Add a title.")
    .max(SOURCE_NAME_MAX_LENGTH, "Use a shorter title."),
  text: z
    .string()
    .trim()
    .min(1, "Add some text.")
    .max(TEXT_SOURCE_MAX_LENGTH, "Use up to 50,000 characters."),
});

export const updateTextSourceInputSchema = sourceIdInputSchema.extend(
  textSourceInputSchema.shape,
);

export type SourceKind = z.infer<typeof sourceKindSchema>;
export type SourceStatus = z.infer<typeof sourceStatusSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Chunk = z.infer<typeof chunkSchema>;
export type SourceDetail = z.infer<typeof sourceDetailSchema>;
export type CreateSourceUploadInput = z.infer<
  typeof createSourceUploadInputSchema
>;
export type SourceUpload = z.infer<typeof sourceUploadSchema>;
export type TextSourceInput = z.infer<typeof textSourceInputSchema>;
