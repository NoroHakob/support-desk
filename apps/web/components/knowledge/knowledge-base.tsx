"use client";

import {
  SOURCE_FILE_MAX_BYTES,
  sourceFileTypes,
  type Source,
} from "@marshaldesk/shared";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Dropzone } from "@/components/dashboard/dropzone";
import {
  SettingsBlock,
  SettingsSection,
} from "@/components/dashboard/settings-section";
import { DeleteSourceDialog } from "@/components/knowledge/delete-source-dialog";
import { SourceDialog } from "@/components/knowledge/source-dialog";
import { TextSourceForm } from "@/components/knowledge/text-source-form";
import { useSourceUploads } from "@/components/knowledge/use-source-uploads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SourceRow } from "@/components/widget-settings/source-row";

export function KnowledgeBase({
  sources,
  answeringCount,
}: {
  sources: Source[];
  answeringCount: number;
}) {
  const uploads = useSourceUploads();
  const [addingText, setAddingText] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Looked up by id so the dialogs follow live status updates.
  const openSource = sources.find((source) => source.id === openId) ?? null;
  const deletingSource =
    sources.find((source) => source.id === deletingId) ?? null;

  return (
    <SettingsSection
      id="knowledge-base"
      title="Knowledge base"
      description={
        answeringCount > 0
          ? `The agent answers from ${answeringCount} ${answeringCount === 1 ? "source" : "sources"}.`
          : "The agent is off until a source is ready. Until then, every conversation comes to you."
      }
      action={
        <Button variant="outline" onClick={() => setAddingText(true)}>
          <Plus data-icon="inline-start" />
          Add text
        </Button>
      }
    >
      <SettingsBlock>
        <Dropzone
          multiple
          accept={sourceFileTypes}
          typeLabel="PDF, Markdown or text"
          maxBytes={SOURCE_FILE_MAX_BYTES}
          title="Drop files here or click to upload"
          description="PDF, Markdown or text, up to 10 MB each. A file with the same name replaces the old one."
          onFiles={uploads.upload}
        />
        {uploads.errors.length > 0 ? (
          <ul
            role="alert"
            className="mt-2 flex flex-col gap-1 text-sm text-destructive"
          >
            {uploads.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </SettingsBlock>
      {sources.length > 0 ? (
        <ul className="divide-y">
          {sources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              uploading={uploads.uploadingIds.has(source.id)}
              onOpen={() => setOpenId(source.id)}
              onDelete={() => setDeletingId(source.id)}
            />
          ))}
        </ul>
      ) : null}

      <Dialog open={addingText} onOpenChange={setAddingText}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add text</DialogTitle>
            <DialogDescription>
              Write answers the agent should know, like your opening hours or
              return policy.
            </DialogDescription>
          </DialogHeader>
          <TextSourceForm
            onSaved={() => setAddingText(false)}
            onCancel={() => setAddingText(false)}
          />
        </DialogContent>
      </Dialog>
      <SourceDialog
        source={openSource}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
      <DeleteSourceDialog
        source={deletingSource}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      />
    </SettingsSection>
  );
}
