// Dev-only check of whether this machine can reach Gemini, and whether the
// classifier's call shape (structured output + thinking level) is what stalls.
//
//   pnpm gemini:ping
//
// Makes exactly two Gemini calls (two of the free tier's daily requests).
// Prints only timings, statuses and error messages, never the API key.

import { google } from "@ai-sdk/google";
import { APICallError, generateText, Output } from "ai";
import * as z from "zod";

// By path, because Node runs this file without a bundler: it strips the types
// from agent.ts, but can't resolve the package entry's extensionless imports.
import {
  AGENT_MODELS,
  THINKING_LEVELS,
} from "../../../packages/shared/src/agent.ts";

process.loadEnvFile(new URL("../.env.local", import.meta.url));

const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
if (!apiKey) {
  throw new Error("Set GOOGLE_GENERATIVE_AI_API_KEY in apps/web/.env.local.");
}

const MODEL = AGENT_MODELS.classifier;
const TIMEOUT_MS = 40_000;

function status(error) {
  if (APICallError.isInstance(error)) return `HTTP ${error.statusCode ?? "?"}`;
  return error instanceof Error ? error.name : "error";
}

function message(error) {
  const text = error instanceof Error ? error.message : String(error);
  return text.replaceAll(apiKey, "[key]").slice(0, 300);
}

async function ping(label, options) {
  const startedAt = Date.now();
  try {
    await generateText({
      model: google(MODEL),
      prompt: "Say OK",
      maxRetries: 0,
      timeout: TIMEOUT_MS,
      ...options,
    });
    console.log(`${label}: ${Date.now() - startedAt} ms, ok`);
  } catch (error) {
    console.log(
      `${label}: ${Date.now() - startedAt} ms, ${status(error)}, ${message(error)}`,
    );
  }
}

console.log(`Model: ${MODEL}`);
await ping("1. plain", {});
await ping(`2. Output.object + thinkingLevel ${THINKING_LEVELS.classifier}`, {
  output: Output.object({ schema: z.object({ reply: z.string() }) }),
  providerOptions: {
    google: {
      thinkingConfig: { thinkingLevel: THINKING_LEVELS.classifier },
    },
  },
});
