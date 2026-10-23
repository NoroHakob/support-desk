import {
  assertNever,
  type Source,
  type SourceStatus,
} from "@marshaldesk/shared";
import { File as FileIcon, TextQuote, Trash2 } from "lucide-react";

import { IconButton } from "@/components/dashboard/icon-button";
import { Badge } from "@/components/ui/badge";
import { formatAgo, formatBytes } from "@/lib/format";

function fileExtension(name: string) {
  return name.includes(".") ? (name.split(".").pop()?.toLowerCase() ?? "") : "";
}

function StatusBadge({ status }: { status: SourceStatus }) {
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
  onDelete,
}: {
  source: Source;
  onDelete?: () => void;
}) {
  const extension = source.kind === "file" ? fileExtension(source.name) : "";
  const meta = [
    source.kind === "file" ? null : "Text",
    source.size === null ? null : formatBytes(source.size),
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
        <span className="truncate text-sm font-medium">{source.name}</span>
        {source.status === "failed" && source.error ? (
          <span className="text-sm text-destructive">{source.error}</span>
        ) : (
          <span
            className="truncate text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {meta.join(" · ")}
          </span>
        )}
      </span>
      <StatusBadge status={source.status} />
      {onDelete ? (
        <IconButton label={`Delete ${source.name}`} onClick={onDelete}>
          <Trash2 />
        </IconButton>
      ) : null}
    </li>
  );
}
