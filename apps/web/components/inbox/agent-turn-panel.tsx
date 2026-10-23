"use client";

import type { AgentTurn, Classification } from "@marshaldesk/shared";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { classificationLabel, outcomeText } from "@/lib/conversation-copy";
import { formatDuration, formatInteger } from "@/lib/format";

export function AgentTurnPanel({
  turn,
  classification,
}: {
  turn: AgentTurn;
  classification: Classification | null;
}) {
  const usedSources = new Set(
    turn.chunks.filter((chunk) => chunk.used).map((chunk) => chunk.sourceId),
  ).size;

  return (
    <Collapsible className="w-full">
      <CollapsibleTrigger className="group/trigger inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        How the agent handled this
        <ChevronDown className="size-3.5 transition-transform duration-150 group-data-panel-open/trigger:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <dl className="mt-2 flex animate-enter flex-col divide-y divide-foreground/5 rounded-lg bg-muted/70 text-xs motion-reduce:animate-none">
          <Row label="Classified as">
            {classification
              ? classificationLabel(classification)
              : "Not classified (image only)"}
          </Row>
          <Row label="Outcome">{outcomeText(turn.outcome, usedSources)}</Row>
          {turn.chunks.length > 0 ? (
            <Row label="Matches">
              <ul className="flex flex-col gap-2">
                {turn.chunks.map((chunk) => (
                  <li key={chunk.chunkId} className="flex flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate">{chunk.sourceName}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {chunk.score.toFixed(2)} ·{" "}
                        {chunk.used ? "Used" : "Below threshold"}
                      </span>
                    </span>
                    <Progress
                      value={Math.round(chunk.score * 100)}
                      aria-label={`${chunk.sourceName} similarity`}
                      className={cn(
                        "[&_[data-slot=progress-track]]:bg-foreground/10",
                        !chunk.used &&
                          "[&_[data-slot=progress-indicator]]:bg-foreground/30",
                      )}
                    />
                  </li>
                ))}
              </ul>
            </Row>
          ) : null}
          <Row label="Model">
            {turn.model} · {formatDuration(turn.latencyMs)} ·{" "}
            {formatInteger(turn.tokensIn)} tokens in,{" "}
            {formatInteger(turn.tokensOut)} out
          </Row>
        </dl>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 px-3 py-2.5">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
