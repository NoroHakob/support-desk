import { google } from "@ai-sdk/google";
import {
  AGENT_MODELS,
  EMBEDDING_DIMENSIONS,
  embeddingDocumentText,
  normalizeVector,
} from "@marshaldesk/shared";
import { withOverloadRetry } from "@marshaldesk/shared/gemini-errors";
import { embedMany } from "ai";

export {
  isQuotaError,
  withOverloadRetry,
} from "@marshaldesk/shared/gemini-errors";

// Background work can wait longer than a visitor before its one retry.
export const OVERLOAD_RETRY_DELAY_MS = 5_000;

/**
 * Embeds chunks one batch at a time, so the free tier's limits hold. Only a
 * temporary overload is retried, once; a 429 fails the run.
 */
export async function embedChunks(title: string, chunks: string[]) {
  const { embeddings } = await withOverloadRetry(
    () =>
      embedMany({
        model: google.embedding(AGENT_MODELS.embedding),
        values: chunks.map((chunk) => embeddingDocumentText(title, chunk)),
        maxParallelCalls: 1,
        maxRetries: 0,
        providerOptions: {
          google: { outputDimensionality: EMBEDDING_DIMENSIONS },
        },
      }),
    {
      delayMs: OVERLOAD_RETRY_DELAY_MS,
      onRetry: () =>
        console.warn(`Gemini is overloaded; retrying embeddings for ${title}.`),
    },
  );
  return embeddings.map((embedding) => {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}.`,
      );
    }
    return normalizeVector(embedding);
  });
}
