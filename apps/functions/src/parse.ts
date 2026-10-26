import { extractText, getDocumentProxy } from "unpdf";

const PDF_HEADER = new TextEncoder().encode("%PDF-");
// Readers accept the header anywhere in the first 1024 bytes.
const PDF_HEADER_SEARCH_BYTES = 1024;

/** Whether the bytes start like a PDF, whatever the file is called. */
export function looksLikePdf(bytes: Uint8Array) {
  const end =
    Math.min(bytes.length, PDF_HEADER_SEARCH_BYTES) - PDF_HEADER.length;
  for (let start = 0; start <= end; start++) {
    if (PDF_HEADER.every((byte, index) => bytes[start + index] === byte)) {
      return true;
    }
  }
  return false;
}

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
