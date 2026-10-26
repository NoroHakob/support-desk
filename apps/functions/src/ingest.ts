import {
  claimIngest,
  failIngest,
  findSourceByStorageKey,
  finishIngest,
  markSourceReady,
} from "@marshaldesk/db";
import { SOURCE_FILE_MAX_BYTES } from "@marshaldesk/shared";

import { embedChunks, isQuotaError } from "./ai";
import { chunkText } from "./chunk";
import { cleanText, fileText, looksLikePdf } from "./parse";
import { publishSource } from "./publish";
import {
  deleteKnowledgeFile,
  headKnowledgeFile,
  readKnowledgeFile,
} from "./storage";
import { regenerateSuggestedQuestions } from "./suggested-questions";

const SOURCE_KEY_PATTERN =
  /^workspaces\/([0-9a-f-]{36})\/sources\/([0-9a-f-]{36})\.(pdf|md|txt)$/;

/** An error whose message the owner sees on the source. */
class IngestError extends Error {}

function readableError(error: unknown) {
  if (error instanceof IngestError) {
    return error.message;
  }
  if (isQuotaError(error)) {
    return "We've hit the AI usage limit for now. Try again later.";
  }
  return "Something went wrong while processing this source. Try again.";
}

async function chunkAndEmbed(name: string, text: string) {
  const chunks = chunkText(cleanText(text));
  if (chunks.length === 0) {
    throw new IngestError(
      "We couldn't find any text. Scanned PDFs aren't supported yet.",
    );
  }
  const embeddings = await embedChunks(name, chunks);
  return chunks.map((content, index) => {
    const embedding = embeddings[index];
    if (!embedding) {
      throw new Error("An embedding is missing.");
    }
    return { content, embedding };
  });
}

// Claims a run, builds the chunks, and swaps them in unless a newer run took
// over. Failures keep the previous chunks answering.
async function ingest(
  workspaceId: string,
  sourceId: string,
  read: (source: {
    kind: "file" | "text";
    storageKey: string | null;
    text: string | null;
  }) => Promise<{ text: string; etag: string | null }>,
) {
  const claim = await claimIngest(workspaceId, sourceId);
  if (!claim) return;
  await publishSource(workspaceId, sourceId);
  try {
    const { text, etag } = await read(claim);
    const chunks = await chunkAndEmbed(claim.name, text);
    await finishIngest({
      workspaceId,
      sourceId,
      revision: claim.revision,
      etag,
      chunks,
    });
  } catch (error) {
    console.error(`Processing source ${sourceId} failed.`, error);
    await failIngest({
      workspaceId,
      sourceId,
      revision: claim.revision,
      error: readableError(error),
    });
  }
  await publishSource(workspaceId, sourceId);
  await regenerateSuggestedQuestions(workspaceId);
}

/** Processes a file the storage trigger reported. */
export async function ingestFile(objectKey: string) {
  const match = SOURCE_KEY_PATTERN.exec(objectKey);
  const [, workspaceId, sourceId, extension] = match ?? [];
  if (!workspaceId || !sourceId || !extension) {
    console.warn(`Ignored an object outside the sources prefix: ${objectKey}`);
    return;
  }
  const source = await findSourceByStorageKey(workspaceId, sourceId, objectKey);
  if (!source) {
    await deleteKnowledgeFile(objectKey);
    return;
  }
  const object = await headKnowledgeFile(objectKey);
  if (!object) return;
  // Triggers are at-least-once, and re-uploading the same file changes nothing.
  if (object.etag && object.etag === source.etag) {
    await markSourceReady(workspaceId, sourceId);
    await publishSource(workspaceId, sourceId);
    return;
  }

  await ingest(workspaceId, sourceId, async (claimed) => {
    if (claimed.storageKey !== objectKey) {
      throw new IngestError("This file was replaced. Try uploading it again.");
    }
    // A presigned PUT can't limit the size, so this is the real check.
    if (object.size > SOURCE_FILE_MAX_BYTES) {
      throw new IngestError("Use a file up to 10 MB.");
    }
    const bytes = await readKnowledgeFile(objectKey);
    // The type comes from the file name, so check the content too (PRD
    // section 10).
    if (extension === "pdf" && !looksLikePdf(bytes)) {
      throw new IngestError(
        "This file isn't a PDF. Check the file and try again.",
      );
    }
    try {
      return { text: await fileText(bytes, extension), etag: object.etag };
    } catch (error) {
      console.error(`Reading ${objectKey} failed.`, error);
      throw new IngestError("We couldn't read this file. Is it damaged?");
    }
  });
}

/** Processes a text source the web app saved. */
export async function ingestTextSource(workspaceId: string, sourceId: string) {
  await ingest(workspaceId, sourceId, async (claimed) => {
    if (claimed.kind !== "text" || !claimed.text) {
      throw new IngestError("This source has no text.");
    }
    return { text: claimed.text, etag: null };
  });
}
