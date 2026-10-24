import { extractText, getDocumentProxy } from "unpdf";

/** The plain text of an uploaded file, by its extension. */
export async function fileText(bytes: Uint8Array, extension: string) {
  if (extension === "pdf") {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  return new TextDecoder().decode(bytes);
}

/** Trims trailing spaces and collapses runs of blank lines. */
export function cleanText(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
