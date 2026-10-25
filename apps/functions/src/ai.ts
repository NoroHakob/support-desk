import { google } from "@ai-sdk/google";
import {
  AGENT_MODELS,
  EMBEDDING_DIMENSIONS,
  embeddingDocumentText,
  normalizeVector,
} from "@marshaldesk/shared";
import { embedMany } from "ai";

export {
  isOverloadError,
  isQuotaError,
} from "@marshaldesk/shared/gemini-errors";

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
