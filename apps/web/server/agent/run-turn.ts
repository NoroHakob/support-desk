import { randomUUID } from "node:crypto";

import { google } from "@ai-sdk/google";
import {
  findConversation,
  isAgentTurnCurrent,
  loadAgentTurnContext,
  saveAgentTurn,
  searchChunks,
} from "@marshaldesk/db";
import {
  AGENT_MODELS,
  assertNever,
  RETRIEVAL,
  type AgentOutcome,
  type Classification,
  type HandoffReason,
  type MessageAuthor,
  type RetrievedChunk,
} from "@marshaldesk/shared";
import { isOverloadError } from "@marshaldesk/shared/gemini-errors";
import { streamText, tool } from "ai";
import * as z from "zod";

import {
  ANSWER_TIMEOUT,
  classify,
  describeError,
  embedQueries,
  overloadDelay,
  OVERLOAD_RETRY_DELAY_MS,
  thinking,
  throwIfSimulated429,
  tokens,
  withOverloadRetry,
} from "@/server/agent/gemini";
import {
  answerInstructions,
  answerPrompt,
  CANNOT_ANSWER_DESCRIPTION,
} from "@/server/agent/prompts";
import {
  sendConversation,
  sendConversationEvent,
} from "@/server/realtime/publish";

// Nothing is published before this much text, so a `cannot_answer` call after
// a short lead-in is never seen (TECH-STACK section 8).
const PUBLISH_AFTER_CHARS = 40;
const CHUNK_INTERVAL_MS = 60;
const GUARD_INTERVAL_MS = 300;

const FALLBACK_REPLY = {
  small_talk: "Hi! How can I help you today?",
  off_topic:
    "Sorry, I can only help with questions about our products and services. Is there anything I can help you with?",
} as const;

function handoffText(reason: HandoffReason) {
  switch (reason) {
    case "no_relevant_knowledge":
      return "I couldn't find an answer to that, so I'm bringing in someone from the team.";
    case "low_confidence":
      return "I'm not sure about that one, so I'm bringing in someone from the team.";
    case "visitor_requested":
    case "agent_off":
      return null;
    default:
      return assertNever(reason);
  }
}

/** Dev-only progress lines, so a turn that stops early is visible. */
function trace(messageId: string, step: string) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[agent ${messageId.slice(0, 8)}] ${step}`);
  }
}

type History = { author: MessageAuthor; body: string }[];

type Turn = {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  agentName: string;
};

/**
 * Sends the reply so far: one publish in flight, at least 60 ms apart, always
 * the newest text.
 */
function chunkPublisher(send: (body: string) => Promise<void>) {
  let latest = "";
  let sent = "";
  let lastSentAt = 0;
  let running: Promise<void> | null = null;

  async function drain() {
    while (latest !== sent) {
      const wait = lastSentAt + CHUNK_INTERVAL_MS - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      sent = latest;
      lastSentAt = Date.now();
      await send(sent);
    }
    running = null;
  }

  return {
    push(body: string) {
      latest = body;
      running ??= drain();
    },
    /** Stops sending and waits for the publish in flight. */
    async stop() {
      latest = sent;
      await running;
    },
  };
}

/**
 * Embeds the question, and for a short follow-up also the question together
 * with the previous one, keeping whichever finds the better match.
 */
async function retrieve(
  workspaceId: string,
  question: string,
  history: History,
  onRetry: (error: unknown) => void,
) {
  const previous = history.findLast((item) => item.author === "visitor")?.body;
  const followUp =
    previous !== undefined &&
    question.trim().split(/\s+/).length <= RETRIEVAL.followUpMaxWords;
  const vectors = await withOverloadRetry(
    () =>
      embedQueries(
        followUp ? [question, `${previous}\n${question}`] : [question],
      ),
    onRetry,
  );
  const results = await Promise.all(
    vectors.map((vector) => searchChunks(workspaceId, vector, RETRIEVAL.topK)),
  );
  return results.reduce((best, result) =>
    (result[0]?.score ?? -1) > (best[0]?.score ?? -1) ? result : best,
  );
}

/**
 * Runs the agent on a saved visitor message (PRD Flow B, steps 3 to 7). Every
 * failure, a 429 included, hands off with `low_confidence` and is never
 * retried, so a used-up free tier costs no extra calls.
 */
export async function runAgentTurn(turn: Turn) {
  const startedAt = Date.now();
  trace(turn.messageId, "start");
  try {
    await runTurn(turn);
  } catch (error) {
    console.error(`Agent turn for message ${turn.messageId} failed.`, error);
  }
  trace(turn.messageId, `end after ${Date.now() - startedAt} ms`);
}

async function runTurn({
  workspaceId,
  conversationId,
  messageId,
  agentName,
}: Turn) {
  const startedAt = Date.now();
  const context = await loadAgentTurnContext({
    workspaceId,
    conversationId,
    messageId,
    historyLimit: RETRIEVAL.historyMessages,
  });
  if (!context) {
    trace(messageId, "stopped: not a visitor message of this conversation");
    return;
  }
  if (
    !(await isAgentTurnCurrent(
      workspaceId,
      conversationId,
      context.message.createdAt,
    ))
  ) {
    trace(messageId, "stopped: conversation isn't ai or has a newer message");
    return;
  }
  const { message, history } = context;
  const question = message.body;

  let classification: Classification | null = null;
  let chunks: RetrievedChunk[] = [];
  let model: string = AGENT_MODELS.classifier;
  const usage = { in: 0, out: 0 };

  async function finish({
    outcome,
    reply,
    handoffReason,
    error,
  }: {
    outcome: Exclude<AgentOutcome, "discarded">;
    reply: { id: string; body: string } | null;
    handoffReason: HandoffReason | null;
    error: string | null;
  }) {
    const saved = await saveAgentTurn({
      workspaceId,
      conversationId,
      messageId,
      messageCreatedAt: message.createdAt,
      classification,
      outcome,
      reply,
      handoffReason,
      log: {
        chunks,
        model,
        tokensIn: usage.in,
        tokensOut: usage.out,
        latencyMs: Date.now() - startedAt,
        error,
      },
      now: new Date(),
    });
    trace(
      messageId,
      saved ? `saved: ${outcome}` : "discarded: the conversation moved on",
    );
    if (!saved) return;
    const row = await findConversation(workspaceId, conversationId);
    // A handoff notifies the owner like a new visitor message (PRD D-6).
    if (row)
      await sendConversation(
        workspaceId,
        row,
        handoffReason ? messageId : null,
      );
  }

  function handOff(reason: HandoffReason, error: string | null) {
    const body = handoffText(reason);
    return finish({
      outcome: "handed_off",
      reply: body ? { id: randomUUID(), body } : null,
      handoffReason: reason,
      error,
    });
  }

  function failed(error: unknown) {
    console.error(
      `Agent turn for message ${messageId}: Gemini call failed.`,
      error,
    );
    return handOff("low_confidence", describeError(error));
  }

  const retrying = (step: string) => (error: unknown) =>
    trace(
      messageId,
      `Gemini overloaded during ${step}; retrying once in ${OVERLOAD_RETRY_DELAY_MS} ms (${describeError(error)})`,
    );

  let label: Classification;
  let shortReply: string | null;
  trace(messageId, "classifying");
  try {
    const result = await withOverloadRetry(
      () => classify({ agentName, history, question }),
      retrying("classify"),
    );
    usage.in += result.tokens.in;
    usage.out += result.tokens.out;
    label = result.label;
    shortReply = result.reply;
    classification = label;
  } catch (error) {
    return failed(error);
  }

  trace(messageId, `classified as ${label}`);
  switch (label) {
    case "small_talk":
    case "off_topic":
      return finish({
        outcome: label === "off_topic" ? "declined" : "replied",
        reply: { id: randomUUID(), body: shortReply ?? FALLBACK_REPLY[label] },
        handoffReason: null,
        error: null,
      });
    case "human_request":
      return handOff("visitor_requested", null);
    case "support_question":
      break;
    default:
      return assertNever(label);
  }

  let matches: Awaited<ReturnType<typeof retrieve>>;
  trace(messageId, "retrieving");
  try {
    matches = await retrieve(workspaceId, question, history, retrying("embed"));
  } catch (error) {
    return failed(error);
  }
  const relevant = (matches[0]?.score ?? -1) >= RETRIEVAL.minScore;
  chunks = matches.map((match) => ({
    chunkId: match.chunkId,
    sourceId: match.sourceId,
    sourceName: match.sourceName,
    score: match.score,
    used: relevant && match.score >= RETRIEVAL.extraScore,
  }));
  trace(
    messageId,
    `best match ${matches[0]?.score.toFixed(3) ?? "none"} (needs ${RETRIEVAL.minScore})`,
  );
  if (!relevant) {
    return handOff("no_relevant_knowledge", null);
  }

  model = AGENT_MODELS.answer;
  const replyId = randomUUID();
  const abort = new AbortController();
  let stale = false;
  let checking = false;
  const guard = setInterval(() => {
    if (checking) return;
    checking = true;
    isAgentTurnCurrent(workspaceId, conversationId, message.createdAt)
      .then((current) => {
        if (!current) {
          stale = true;
          abort.abort();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        checking = false;
      });
  }, GUARD_INTERVAL_MS);
  const publisher = chunkPublisher((body) =>
    sendConversationEvent(conversationId, {
      type: "agent.chunk",
      messageId: replyId,
      body,
    }),
  );
  const done = () =>
    sendConversationEvent(conversationId, {
      type: "agent.done",
      messageId: replyId,
    });

  let text = "";
  let cannotAnswer = false;
  async function streamAnswer() {
    throwIfSimulated429();
    const result = streamText({
      model: google(AGENT_MODELS.answer),
      instructions: answerInstructions(agentName),
      prompt: answerPrompt({
        chunks: matches.filter((_, index) => chunks[index]?.used),
        history,
        question,
      }),
      tools: {
        cannot_answer: tool({
          description: CANNOT_ANSWER_DESCRIPTION,
          inputSchema: z.object({}),
        }),
      },
      maxRetries: 0,
      abortSignal: abort.signal,
      timeout: ANSWER_TIMEOUT,
      providerOptions: thinking("answer"),
    });
    for await (const part of result.stream) {
      if (part.type === "text-delta") {
        text += part.text;
        if (!cannotAnswer && text.length >= PUBLISH_AFTER_CHARS) {
          publisher.push(text);
        }
      } else if (part.type === "tool-call") {
        if (part.toolName === "cannot_answer") cannotAnswer = true;
      } else if (part.type === "error") {
        throw part.error;
      }
    }
    const answerUsage = tokens(await result.totalUsage);
    usage.in += answerUsage.in;
    usage.out += answerUsage.out;
  }

  trace(messageId, "streaming the answer");
  try {
    try {
      await streamAnswer();
    } catch (error) {
      // Only before any text has streamed, so the visitor never sees a reply
      // start over.
      if (text !== "" || cannotAnswer || stale || !isOverloadError(error)) {
        throw error;
      }
      retrying("answer")(error);
      await overloadDelay();
      await streamAnswer();
    }
  } catch (error) {
    clearInterval(guard);
    await publisher.stop();
    if (stale) {
      await done();
      return finish({
        outcome: "answered",
        reply: null,
        handoffReason: null,
        error: null,
      });
    }
    await done();
    return failed(error);
  }
  clearInterval(guard);
  await publisher.stop();

  const body = text.trim();
  trace(
    messageId,
    `answer finished: ${body.length} characters${cannotAnswer ? ", cannot_answer called" : ""}`,
  );
  if (cannotAnswer || !body) {
    await done();
    return handOff("low_confidence", null);
  }
  // Saved and sent as an update first, so the widget swaps the stream for
  // the saved message before `agent.done` clears it.
  await finish({
    outcome: "answered",
    reply: { id: replyId, body },
    handoffReason: null,
    error: null,
  });
  await done();
}
