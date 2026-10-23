"use client";

import { cn } from "cn";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

import { formatBytes } from "@/lib/format";

export type DropzoneFileType = { extension: string; mime: string };

function matchesType(file: File, types: readonly DropzoneFileType[]) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return types.some(
    (type) => type.mime === file.type || type.extension === extension,
  );
}

export function Dropzone({
  accept,
  typeLabel,
  maxBytes,
  multiple = false,
  compact = false,
  disabled = false,
  title,
  description,
  onFiles,
  className,
}: {
  accept: readonly DropzoneFileType[];
  typeLabel: string;
  maxBytes: number;
  multiple?: boolean;
  compact?: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onFiles: (files: File[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState<string[]>([]);

  function handleFiles(list: FileList | null) {
    if (disabled) return;
    const files = Array.from(list ?? []).slice(0, multiple ? undefined : 1);
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (!matchesType(file, accept)) {
        rejected.push(`${file.name} isn't a ${typeLabel} file.`);
      } else if (file.size > maxBytes) {
        rejected.push(`${file.name} is larger than ${formatBytes(maxBytes)}.`);
      } else {
        accepted.push(file);
      }
    }
    setRejections(rejected);
    if (accepted.length > 0) {
      onFiles(accepted);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        aria-disabled={disabled}
        data-dragging={dragging}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          const next = event.relatedTarget;
          if (!(next instanceof Node && event.currentTarget.contains(next))) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "group/dropzone flex w-full items-center rounded-xl border border-dashed border-foreground/15 bg-muted/30 text-left transition-colors duration-150 outline-none hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-muted/30 data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5",
          compact ? "gap-3 p-3" : "flex-col justify-center gap-3 px-6 py-8",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-foreground/10 group-data-[dragging=true]/dropzone:text-primary",
            compact ? "size-9" : "size-11",
          )}
        >
          <Upload className={compact ? "size-4" : "size-5"} />
        </span>
        <span
          className={cn(
            "flex flex-col gap-0.5",
            compact ? "min-w-0" : "items-center text-center",
          )}
        >
          <span className="text-sm font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        multiple={multiple}
        accept={accept
          .flatMap((type) => [type.mime, `.${type.extension}`])
          .join(",")}
        onChange={(event) => {
          handleFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      {rejections.length > 0 ? (
        <ul
          role="alert"
          className="flex flex-col gap-1 text-sm text-destructive"
        >
          {rejections.map((rejection) => (
            <li key={rejection}>{rejection}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
