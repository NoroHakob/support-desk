import {
  assertNever,
  type Source,
  type SourceStatus,
} from "@marshaldesk/shared";
import { File as FileIcon, TextQuote, Trash2 } from "lucide-react";

import { IconButton } from "@/components/dashboard/icon-button";
import { Badge } from "@/components/ui/badge";
import { formatAgo, formatBytes, formatInteger } from "@/lib/format";

function fileExtension(name: string) {
  return name.includes(".") ? (name.split(".").pop()?.toLowerCase() ?? "") : "";
}

function StatusBadge({
  status,
  uploading,
}: {
  status: SourceStatus;
  uploading: boolean;
}) {
  if (uploading) {
    return <Badge variant="warning">Uploading</Badge>;
  }
  switch (status) {
    case "ready":
      return <Badge variant="success">Ready</Badge>;
    case "processing":
      return <Badge variant="warning">Processing</Badge>;
    case "uploaded":
      return <Badge variant="warning">Uploaded</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return assertNever(status);
  }
}

export function SourceRow({
  source,
  uploading = false,
  onOpen,
  onDelete,
}: {
  source: Source;
  uploading?: boolean;
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  const extension = source.kind === "file" ? fileExtension(source.name) : "";
  const meta = [
    source.kind === "file" ? null : "Text",
    source.size === null ? null : formatBytes(source.size),
    source.chunkCount === 0
      ? null
      : `${formatInteger(source.chunkCount)} ${source.chunkCount === 1 ? "chunk" : "chunks"}`,
    `Added ${formatAgo(source.createdAt)}`,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {source.kind === "file" ? (
          <FileIcon className="size-5" />
        ) : (
          <TextQuote className="size-5" />
        )}
        {extension ? (
          <span className="absolute -bottom-1 rounded-sm bg-background px-1 text-[10px] leading-4 font-medium text-foreground ring-1 ring-foreground/10">
            {extension}
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="truncate rounded-sm text-left text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {source.name}
          </button>
        ) : (
          <span className="truncate text-sm font-medium">{source.name}</span>
        )}
        {source.error ? (
          <span
            className={
              source.status === "failed"
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {source.status === "failed"
              ? source.error
              : `The previous version keeps answering. ${source.error}`}
          </span>
        ) : (
          <span
            className="truncate text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {meta.join(" · ")}
          </span>
        )}
      </span>
      <StatusBadge status={source.status} uploading={uploading} />
      {onDelete ? (
        <IconButton label={`Delete ${source.name}`} onClick={onDelete}>
          <Trash2 />
        </IconButton>
      ) : null}
    </li>
  );
}
