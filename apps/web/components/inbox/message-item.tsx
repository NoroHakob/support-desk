"use client";

import {
  assertNever,
  type HandoffReason,
  type Message,
} from "@marshaldesk/shared";
import { cn } from "cn";
import { FileText } from "lucide-react";
import { Streamdown } from "streamdown";

import { AgentTurnPanel } from "@/components/inbox/agent-turn-panel";
import { Badge } from "@/components/ui/badge";
import { systemEventText } from "@/lib/conversation-copy";
import { formatDateTime, formatShortAgo } from "@/lib/format";

function MessageBody({ body }: { body: string }) {
  return (
    <Streamdown
      mode="static"
      controls={false}
      className="text-sm leading-relaxed wrap-break-word [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    >
      {body}
    </Streamdown>
  );
}

function Meta({ children, at }: { children?: React.ReactNode; at: Date }) {
  return (
    <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
      {children ? <span>{children}</span> : null}
      {children ? <span aria-hidden>·</span> : null}
      <time
        dateTime={at.toISOString()}
        title={formatDateTime(at)}
        suppressHydrationWarning
      >
        {formatShortAgo(at)}
      </time>
    </span>
  );
}

export function MessageItem({
  message,
  handoffReason,
}: {
  message: Message;
  handoffReason: HandoffReason | null;
}) {
  switch (message.author) {
    case "system": {
      if (message.systemEvent === null) return null;
      if (message.systemEvent === "greeting") {
        return (
          <div className="flex flex-col items-end gap-1">
            <div className="max-w-[80%] rounded-xl px-3.5 py-2.5 ring-1 ring-foreground/10">
              <MessageBody body={message.body} />
            </div>
            <Meta at={message.createdAt}>Greeting</Meta>
          </div>
        );
      }
      return (
        <div className="flex justify-center py-1">
          <p className="max-w-[85%] rounded-lg bg-muted/60 px-3 py-1.5 text-center text-xs text-muted-foreground">
            {systemEventText(message.systemEvent, handoffReason)}
          </p>
        </div>
      );
    }
    case "visitor":
      return (
        <div className="flex flex-col items-start gap-1">
          <div className="max-w-[80%] rounded-xl bg-muted px-3.5 py-2.5">
            <MessageBody body={message.body} />
          </div>
          <Meta at={message.createdAt}>
            {message.declined ? (
              <Badge variant="outline" className="text-muted-foreground">
                Declined
              </Badge>
            ) : null}
          </Meta>
          {message.agentTurn ? (
            <div className="w-full max-w-[80%] px-1 pt-0.5">
              <AgentTurnPanel
                turn={message.agentTurn}
                classification={message.classification}
              />
            </div>
          ) : null}
        </div>
      );
    case "agent":
      return (
        <div className="flex flex-col items-end gap-1">
          <div className="max-w-[80%] rounded-xl border border-primary/45 bg-primary/8 px-3.5 py-2.5">
            <MessageBody body={message.body} />
          </div>
          {message.sources.length > 0 ? (
            <div className="flex max-w-[80%] flex-wrap items-center justify-end gap-1.5 px-1">
              <span className="text-xs text-muted-foreground">
                Answered from
              </span>
              {message.sources.map((source) => (
                <Badge
                  key={source.id}
                  variant="secondary"
                  className="font-normal text-muted-foreground"
                >
                  <FileText />
                  {source.name}
                </Badge>
              ))}
            </div>
          ) : null}
          <Meta at={message.createdAt}>Agent</Meta>
        </div>
      );
    case "member":
      return (
        <div className="flex flex-col items-end gap-1">
          <div
            className={cn(
              "max-w-[80%] rounded-xl bg-primary px-3.5 py-2.5 text-primary-foreground",
              "[&_a]:text-primary-foreground [&_a]:underline",
            )}
          >
            <MessageBody body={message.body} />
          </div>
          <Meta at={message.createdAt}>You</Meta>
        </div>
      );
    default:
      return assertNever(message.author);
  }
}
