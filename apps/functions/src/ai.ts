import { google } from "@ai-sdk/google";
import {
  AGENT_MODELS,
  EMBEDDING_DIMENSIONS,
  embeddingDocumentText,
  normalizeVector,
} from "@marshaldesk/shared";
import { APICallError, embedMany } from "ai";

/** Whether Gemini turned a call down for quota or rate limits (HTTP 429). */
export function isQuotaError(error: unknown) {
  return APICallError.isInstance(error) && error.statusCode === 429;
}

/** Whether Gemini was temporarily overloaded (HTTP 503, "high demand"). */
export function isOverloadError(error: unknown) {
  return (
    APICallError.isInstance(error) &&
    error.statusCode !== 429 &&
    (error.statusCode === 503 || /high demand/i.test(error.message))
  );
}

/** Embeds chunks one batch at a time, so the free tier's limits hold. */
export async function embedChunks(title: string, chunks: string[]) {
  const { embeddings } = await embedMany({
    model: google.embedding(AGENT_MODELS.embedding),
    values: chunks.map((chunk) => embeddingDocumentText(title, chunk)),
    maxParallelCalls: 1,
    maxRetries: 1,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMENSIONS },
    },
  });
  return embeddings.map((embedding) => {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}.`,
      );
    }
    return normalizeVector(embedding);
  });
}
