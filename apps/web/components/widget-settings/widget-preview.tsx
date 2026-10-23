import type { WidgetPosition } from "@marshaldesk/shared";
import { cn } from "cn";
import { Lock } from "lucide-react";

import { WidgetLauncher } from "@/components/widget/widget-launcher";
import {
  WidgetPanel,
  type WidgetPanelProps,
} from "@/components/widget/widget-panel";

export function WidgetPreview({
  domain,
  position,
  ...panel
}: WidgetPanelProps & { domain: string; position: WidgetPosition }) {
  const left = position === "bottom-left";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Preview</h2>
        <p className="text-sm text-muted-foreground">
          How visitors see your widget. Changes show up right away.
        </p>
      </div>
      <div
        inert
        className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 select-none"
      >
        <div className="flex h-10 items-center gap-3 border-b px-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </span>
          <span className="flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-md bg-muted px-2.5 text-xs text-muted-foreground">
            <Lock className="size-3 shrink-0" />
            <span className="truncate">{domain}</span>
          </span>
        </div>

        <div className="relative h-148 bg-muted/40 p-4">
          <PagePlaceholder mirrored={!left} />
          <div
            className={cn(
              "absolute inset-y-4 flex w-82 max-w-[calc(100%-2rem)] flex-col gap-3",
              left ? "left-4 items-start" : "right-4 items-end",
            )}
          >
            <WidgetPanel {...panel} className="min-h-0 w-full flex-1" />
            <WidgetLauncher accentHex={panel.accentHex} open />
          </div>
        </div>
      </div>
    </div>
  );
}

function PagePlaceholder({ mirrored }: { mirrored: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-full flex-col gap-3",
        mirrored ? "items-start" : "items-end",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="h-3 w-16 rounded-full bg-foreground/10" />
        <span className="flex gap-2">
          <span className="h-3 w-8 rounded-full bg-foreground/8" />
          <span className="h-3 w-8 rounded-full bg-foreground/8" />
          <span className="h-3 w-8 rounded-full bg-foreground/8" />
        </span>
      </div>
      <span className="mt-6 h-5 w-2/3 rounded-md bg-foreground/10" />
      <span className="h-3 w-1/2 rounded-full bg-foreground/8" />
      <span className="h-3 w-2/5 rounded-full bg-foreground/8" />
      <div className="mt-4 grid w-full grid-cols-2 gap-3">
        <span className="h-24 rounded-lg bg-foreground/6" />
        <span className="h-24 rounded-lg bg-foreground/6" />
      </div>
    </div>
  );
}
