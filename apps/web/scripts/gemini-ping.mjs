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

process.loadEnvFile(new URL("../.env.local", import.meta.url));

const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
if (!apiKey) {
  throw new Error("Set GOOGLE_GENERATIVE_AI_API_KEY in apps/web/.env.local.");
}

const MODEL = "gemini-3.5-flash-lite";
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

await ping("1. plain", {});
await ping("2. Output.object + thinkingLevel low", {
  output: Output.object({ schema: z.object({ reply: z.string() }) }),
  providerOptions: {
    google: { thinkingConfig: { thinkingLevel: "low" } },
  },
});
