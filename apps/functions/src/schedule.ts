import {
  applyConversationAction,
  failIngest,
  listIdleConversations,
  listStuckSources,
  listWorkspacesNeedingQuestions,
} from "@marshaldesk/db";

import { publishConversation, publishSource } from "./publish";
import { regenerateSuggestedQuestions } from "./suggested-questions";

const AUTO_CLOSE_AFTER_MS = 24 * 60 * 60 * 1000;
const STUCK_AFTER_MS = 15 * 60 * 1000;

/** PRD D-5: open conversations close after 24 hours without messages. */
async function closeIdleConversations(now: Date) {
  const idle = await listIdleConversations(
    new Date(now.getTime() - AUTO_CLOSE_AFTER_MS),
  );
  for (const conversation of idle) {
    const result = await applyConversationAction({
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      action: "close",
      memberId: null,
      body: null,
      now,
    });
    if (result.ok) {
      await publishConversation(conversation.workspaceId, conversation.id);
    }
  }
}

// A file whose upload never finished, or a run that died, would otherwise
// show as processing forever.
async function sweepStuckSources(now: Date) {
  const stuck = await listStuckSources(
    new Date(now.getTime() - STUCK_AFTER_MS),
  );
  for (const source of stuck) {
    await failIngest({
      workspaceId: source.workspaceId,
      sourceId: source.id,
      revision: null,
      error:
        source.status === "uploaded" && source.kind === "file"
          ? "The upload didn't finish. Try uploading the file again."
          : "Processing didn't finish. Try again.",
    });
    await publishSource(source.workspaceId, source.id);
  }
}

/** Runs every 15 minutes. */
export async function runSchedule() {
  const now = new Date();
  await closeIdleConversations(now);
  await sweepStuckSources(now);
  // Covers batches whose last source was swept instead of finishing. Each
  // claim succeeds once per knowledge base change, so this can't loop.
  for (const workspaceId of await listWorkspacesNeedingQuestions()) {
    await regenerateSuggestedQuestions(workspaceId);
  }
}
