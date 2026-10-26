import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import {
  AGENT_MODELS,
  classificationSchema,
  EMBEDDING_DIMENSIONS,
  embeddingQueryText,
  normalizeVector,
  THINKING_LEVELS,
  type MessageAuthor,
} from "@marshaldesk/shared";
import {
  APICallError,
  embedMany,
  generateText,
  Output,
  type LanguageModelUsage,
} from "ai";
import * as z from "zod";

import { classifierInstructions, classifierPrompt } from "./prompts";

const REPLY_MAX_LENGTH = 600;

// Without these a stalled Gemini request waits for Node's 300-second network
// timeout, leaving the turn silent; a timeout hands off like any failure.
const CLASSIFY_TIMEOUT_MS = 30_000;
const EMBED_TIMEOUT_MS = 20_000;
export const ANSWER_TIMEOUT = { totalMs: 90_000, firstChunkMs: 30_000 };

export const OVERLOAD_RETRY_DELAY_MS = 2_000;

export function overloadDelay() {
  return new Promise((resolve) => setTimeout(resolve, OVERLOAD_RETRY_DELAY_MS));
}

const classifierOutputSchema = z.object({
  label: classificationSchema,
  reply: z.string().nullable(),
  handoffReply: z.string().nullable(),
});

export function thinking(use: keyof typeof THINKING_LEVELS) {
  return {
    google: {
      thinkingConfig: { thinkingLevel: THINKING_LEVELS[use] },
    } satisfies GoogleLanguageModelOptions,
  };
}

export function tokens(usage: LanguageModelUsage) {
  return { in: usage.inputTokens ?? 0, out: usage.outputTokens ?? 0 };
}

/**
 * Dev-only stand-in for a used-up free tier: with AGENT_SIMULATE_429=1 every
 * agent call fails like a 429, without calling Gemini.
 */
export function throwIfSimulated429() {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.AGENT_SIMULATE_429 === "1"
  ) {
    throw new APICallError({
      message: "Simulated quota error (AGENT_SIMULATE_429).",
      url: "simulated",
      requestBodyValues: {},
      statusCode: 429,
    });
  }
}

/** A short description of a failed call, for logs and `agent_turns`. */
export function describeError(error: unknown) {
  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return `Gemini quota or rate limit (429): ${error.message}`.slice(0, 500);
  }
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}

/**
 * Labels the message and, for small talk and off-topic, writes the reply. For
 * support questions it also writes the line shown if the turn hands off, so
 * that line is in the visitor's language without another call (PRD AI-7).
 */
export async function classify({
  agentName,
  history,
  question,
}: {
  agentName: string;
  history: readonly { author: MessageAuthor; body: string }[];
  question: string;
}) {
  throwIfSimulated429();
  const { output, totalUsage } = await generateText({
    model: google(AGENT_MODELS.classifier),
    instructions: classifierInstructions(agentName),
    prompt: classifierPrompt(history, question),
    output: Output.object({ schema: classifierOutputSchema }),
    maxRetries: 0,
    timeout: CLASSIFY_TIMEOUT_MS,
    providerOptions: thinking("classifier"),
  });
  return {
    label: output.label,
    reply: output.reply?.trim().slice(0, REPLY_MAX_LENGTH) || null,
    handoffReply:
      output.handoffReply?.trim().slice(0, REPLY_MAX_LENGTH) || null,
    tokens: tokens(totalUsage),
  };
}

/** Embeds search queries with Google's query prefix, as unit vectors. */
export async function embedQueries(queries: string[]) {
  throwIfSimulated429();
  const { embeddings } = await embedMany({
    model: google.embedding(AGENT_MODELS.embedding),
    values: queries.map(embeddingQueryText),
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
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
