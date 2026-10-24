import { createHash, timingSafeEqual } from "node:crypto";

import { waitUntil } from "@neon/functions";
import { parseTriggerDelivery } from "@neon/functions/triggers";
import * as z from "zod";

import { requireEnv } from "./env";
import { ingestFile, ingestTextSource } from "./ingest";
import { runSchedule } from "./schedule";
import { KNOWLEDGE_FILES_BUCKET } from "./storage";
import { regenerateSuggestedQuestions } from "./suggested-questions";

// The `jobs` function (TECH-STACK section 9). Every route answers 202 and
// does its work in waitUntil.

const workspaceInputSchema = z.object({ workspaceId: z.uuid() });
const textSourceInputSchema = workspaceInputSchema.extend({
  sourceId: z.uuid(),
});
const replayInputSchema = z.object({ objectKey: z.string().min(1) });

// Both values are hashed first so the comparison takes the same time whatever
// their lengths.
function hasSecret(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(
    digest(authorization.slice("Bearer ".length)),
    digest(requireEnv("FUNCTIONS_SECRET")),
  );
}

function accepted(work: Promise<void>) {
  waitUntil(
    work.catch((error: unknown) => console.error("A job failed.", error)),
  );
  return new Response(null, { status: 202 });
}

async function readJson<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema> | null> {
  try {
    const parsed = schema.safeParse(await request.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Neon strips client-sent x-neon-* headers, so a valid delivery comes from a
// trigger. The bearer secret allows replaying one by hand.
async function sourceUploaded(request: Request) {
  if (hasSecret(request)) {
    const replay = await readJson(request, replayInputSchema);
    return replay
      ? accepted(ingestFile(replay.objectKey))
      : new Response("Invalid body", { status: 400 });
  }
  const parsed = await parseTriggerDelivery(request);
  if (!parsed.ok) {
    return new Response(parsed.error, {
      status: parsed.error === "invalid_body" ? 400 : 401,
    });
  }
  const { invocation } = parsed;
  if (
    invocation.type !== "storage_object_created" ||
    invocation.data.bucketName !== KNOWLEDGE_FILES_BUCKET
  ) {
    return new Response("Unexpected trigger", { status: 400 });
  }
  return accepted(ingestFile(invocation.data.objectKey));
}

async function schedule(request: Request) {
  if (!hasSecret(request)) {
    const parsed = await parseTriggerDelivery(request);
    if (!parsed.ok || parsed.invocation.type !== "schedule") {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  return accepted(runSchedule());
}

async function fromApp<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
  run: (input: z.infer<Schema>) => Promise<void>,
) {
  if (!hasSecret(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const input = await readJson(request, schema);
  return input
    ? accepted(run(input))
    : new Response("Invalid body", { status: 400 });
}

const jobs = {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    switch (new URL(request.url).pathname) {
      case "/triggers/source-uploaded":
        return sourceUploaded(request);
      case "/triggers/auto-close":
        return schedule(request);
      case "/ingest/text":
        return fromApp(request, textSourceInputSchema, (input) =>
          ingestTextSource(input.workspaceId, input.sourceId),
        );
      case "/suggested-questions":
        return fromApp(request, workspaceInputSchema, (input) =>
          regenerateSuggestedQuestions(input.workspaceId),
        );
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};

export default jobs;
