"use client";

import { assertNever, type Source } from "@marshaldesk/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { TextSourceForm } from "@/components/knowledge/text-source-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInteger } from "@/lib/format";
import { orpc } from "@/lib/orpc";

function chunkSummary(source: Source) {
  switch (source.status) {
    case "uploaded":
    case "processing":
      return source.chunkCount > 0
        ? "Processing a new version. The agent answers from the chunks below until it's ready."
        : "Processing. The chunks appear here once it's ready.";
    case "ready":
    case "failed":
      return source.chunkCount === 1
        ? "The agent answers from this 1 chunk."
        : `The agent answers from these ${formatInteger(source.chunkCount)} chunks.`;
    default:
      return assertNever(source.status);
  }
}

/** Shows the chunks extracted from a source, to debug answers (PRD K-6). */
export function SourceDialog({
  source,
  onOpenChange,
}: {
  source: Source | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const detail = useQuery({
    ...orpc.knowledge.source.queryOptions({ input: { id: source?.id ?? "" } }),
    enabled: source !== null,
  });

  return (
    <Dialog
      open={source !== null}
      onOpenChange={(open) => {
        if (!open) setEditing(false);
        onOpenChange(open);
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        {source ? (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="truncate">
                {editing ? "Edit text source" : source.name}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Saving processes the text again. The current chunks keep answering until then."
                  : chunkSummary(source)}
              </DialogDescription>
            </DialogHeader>
            {editing && detail.data?.text != null ? (
              <TextSourceForm
                sourceId={source.id}
                defaultValues={{ name: source.name, text: detail.data.text }}
                onSaved={() => setEditing(false)}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
                  {detail.isPending ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                    </div>
                  ) : detail.isError ? (
                    <p className="text-sm text-destructive">
                      Couldn&apos;t load the chunks. Try again.
                    </p>
                  ) : (
                    <ol className="flex flex-col gap-3">
                      {detail.data.chunks.map((chunk) => (
                        <li
                          key={chunk.id}
                          className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3 ring-1 ring-foreground/5"
                        >
                          <span className="text-xs text-muted-foreground">
                            Chunk {formatInteger(chunk.position + 1)} ·{" "}
                            {formatInteger(chunk.content.length)} characters
                          </span>
                          <p className="text-sm wrap-break-word whitespace-pre-wrap">
                            {chunk.content}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                {source.kind === "text" && detail.data?.text != null ? (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      Edit text
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
