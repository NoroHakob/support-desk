import { cn } from "cn";
import { ArrowRight, Paperclip, SendHorizontal, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/user";

export function AgentAvatar({
  src,
  name,
  size,
}: {
  src: string;
  name: string;
  size: "sm" | "default" | "lg";
}) {
  return (
    <Avatar size={size} className="after:hidden">
      <AvatarImage src={src} alt="" />
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

export type WidgetPanelProps = {
  agentName: string;
  agentAvatarUrl: string;
  accentHex: string;
  greeting: string;
  suggestedQuestions: string[];
  agentOn: boolean;
  className?: string;
};

export function WidgetPanel({
  agentName,
  agentAvatarUrl,
  accentHex,
  greeting,
  suggestedQuestions,
  agentOn,
  className,
}: WidgetPanelProps) {
  return (
    <div
      style={{ "--widget-accent": accentHex } as React.CSSProperties}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl bg-background text-foreground shadow-[0_18px_50px_-12px_rgb(0_0_0/0.28)] ring-1 ring-foreground/10",
        className,
      )}
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <AgentAvatar src={agentAvatarUrl} name={agentName} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-[19px] leading-6 tracking-[-0.02em]">
            {agentName}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-(--widget-accent)" />
            {agentOn
              ? "Answers right away, any time"
              : "A person will reply here"}
          </span>
        </div>
        <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground">
          <X className="size-4" />
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-4">
        <div className="flex items-end gap-2">
          <AgentAvatar src={agentAvatarUrl} name={agentName} size="sm" />
          <p className="max-w-[85%] rounded-xl rounded-bl-sm bg-muted px-3 py-2 text-sm leading-relaxed wrap-break-word whitespace-pre-line">
            {greeting}
          </p>
        </div>

        {agentOn && suggestedQuestions.length > 0 ? (
          <ul className="ml-8 divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10">
            {suggestedQuestions.map((question) => (
              <li
                key={question}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <span>{question}</span>
                <ArrowRight className="size-4 shrink-0 text-(--widget-accent)" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <footer className="flex flex-col gap-2 px-3 pb-3">
        {agentOn ? (
          <span className="self-center rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-foreground/10">
            Talk to a human
          </span>
        ) : null}
        <div className="flex items-center gap-1 rounded-lg bg-background py-1 pr-1 pl-3 ring-1 ring-foreground/15">
          <span className="flex-1 truncate text-sm text-muted-foreground">
            Write a message…
          </span>
          <span className="flex size-8 items-center justify-center text-muted-foreground">
            <Paperclip className="size-4" />
          </span>
          <span className="flex size-8 items-center justify-center rounded-md bg-(--widget-accent) text-white">
            <SendHorizontal className="size-4" />
          </span>
        </div>
      </footer>
    </div>
  );
}
