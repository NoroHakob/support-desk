"use client";

import { assertNever } from "@marshaldesk/shared";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AutosaveStatus } from "@/components/widget-settings/use-autosave";

function StatusText({
  status,
  onRetry,
}: {
  status: AutosaveStatus;
  onRetry: () => void;
}) {
  switch (status) {
    case "idle":
      return null;
    case "saving":
      return (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Saving…
        </>
      );
    case "saved":
      return (
        <>
          <Check className="size-4" />
          Saved
        </>
      );
    case "failed":
      return (
        <>
          <CircleAlert className="size-4 text-destructive" />
          <span className="text-destructive">Couldn&apos;t save</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </>
      );
    default:
      return assertNever(status);
  }
}

export function SaveStatus({
  status,
  onRetry,
}: {
  status: AutosaveStatus;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-8 items-center gap-1.5 text-sm text-muted-foreground"
    >
      <StatusText status={status} onRetry={onRetry} />
    </div>
  );
}
