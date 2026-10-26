import {
  createTextSource,
  deleteSource,
  failUpload,
  findSource,
  findSourceDetail,
  listSources,
  saveFileSource,
  updateTextSource,
} from "@marshaldesk/db";
import { sourceFileType, UPLOAD_UNFINISHED_ERROR } from "@marshaldesk/shared";
import { ORPCError } from "@orpc/server";

import { callJobs } from "@/server/jobs";
import { ownerProcedure } from "@/server/orpc/base";
import { publishWorkspaceEvent, type Defer } from "@/server/realtime/publish";
import { deleteKnowledgeFile, presignKnowledgeFilePut } from "@/server/storage";

const UPLOAD_EXPIRES_IN_SECONDS = 5 * 60;

// Loads a source that was just saved and tells the dashboard about it.
async function loadAndPublish(
  after: Defer | undefined,
  workspaceId: string,
  sourceId: string,
) {
  const source = await findSource(workspaceId, sourceId);
  if (!source) {
    throw new ORPCError("NOT_FOUND");
  }
  publishWorkspaceEvent(after, workspaceId, { type: "source.updated", source });
  return source;
}

export const knowledge = {
  sources: ownerProcedure.knowledge.sources.handler(({ context }) =>
    listSources(context.workspaceId),
  ),

  source: ownerProcedure.knowledge.source.handler(
    async ({ context, input, errors }) => {
      const detail = await findSourceDetail(context.workspaceId, input.id);
      if (!detail) {
        throw errors.NOT_FOUND();
      }
      return detail;
    },
  ),

  // The storage trigger starts processing once the file lands in the bucket.
  createUpload: ownerProcedure.knowledge.createUpload.handler(
    async ({ context, input }) => {
      const type = sourceFileType(input.name);
      if (!type) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Use a PDF, Markdown or text file.",
        });
      }
      const { id, storageKey } = await saveFileSource({
        workspaceId: context.workspaceId,
        name: input.name,
        mime: type.mime,
        size: input.size,
        extension: type.extension,
      });
      const upload = await presignKnowledgeFilePut({
        key: storageKey,
        contentType: type.mime,
        contentLength: input.size,
        expiresIn: UPLOAD_EXPIRES_IN_SECONDS,
      });
      const source = await loadAndPublish(
        context.after,
        context.workspaceId,
        id,
      );
      return { source, ...upload };
    },
  ),

  // Without this the source would look like it's waiting for its file until
  // the 15-minute sweep.
  failUpload: ownerProcedure.knowledge.failUpload.handler(
    async ({ context, input }) => {
      await failUpload(context.workspaceId, input.id, UPLOAD_UNFINISHED_ERROR);
      return loadAndPublish(context.after, context.workspaceId, input.id);
    },
  ),

  createTextSource: ownerProcedure.knowledge.createTextSource.handler(
    async ({ context, input }) => {
      const id = await createTextSource(context.workspaceId, input);
      callJobs(context.after, "/ingest/text", {
        workspaceId: context.workspaceId,
        sourceId: id,
      });
      return loadAndPublish(context.after, context.workspaceId, id);
    },
  ),

  updateTextSource: ownerProcedure.knowledge.updateTextSource.handler(
    async ({ context, input, errors }) => {
      const updated = await updateTextSource(context.workspaceId, input.id, {
        name: input.name,
        text: input.text,
      });
      if (!updated) {
        throw errors.NOT_FOUND();
      }
      callJobs(context.after, "/ingest/text", {
        workspaceId: context.workspaceId,
        sourceId: input.id,
      });
      return loadAndPublish(context.after, context.workspaceId, input.id);
    },
  ),

  deleteSource: ownerProcedure.knowledge.deleteSource.handler(
    async ({ context, input, errors }) => {
      const deleted = await deleteSource(context.workspaceId, input.id);
      if (!deleted) {
        throw errors.NOT_FOUND();
      }
      publishWorkspaceEvent(context.after, context.workspaceId, {
        type: "source.deleted",
        sourceId: input.id,
      });
      callJobs(context.after, "/suggested-questions", {
        workspaceId: context.workspaceId,
      });
      if (deleted.storageKey) {
        const key = deleted.storageKey;
        // The chunks are already gone, so a leftover file is only logged.
        try {
          await deleteKnowledgeFile(key);
        } catch (error) {
          console.error(`Couldn't delete the source file ${key}.`, error);
        }
      }
    },
  ),
};
