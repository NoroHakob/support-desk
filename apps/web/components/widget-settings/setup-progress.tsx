import { cn } from "cn";
import { ArrowRight, Check } from "lucide-react";

export type SetupStep = {
  id: string;
  title: string;
  description: string;
  href: `#${string}`;
  done: boolean;
};

export function SetupProgress({ steps }: { steps: SetupStep[] }) {
  const doneCount = steps.filter((step) => step.done).length;
  const nextId = steps.find((step) => !step.done)?.id;

  if (!nextId) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Setup checklist">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-[-0.01em]">
            Get your widget live
          </h2>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {steps.length} steps done.
          </p>
        </div>
        <span className="flex gap-1.5 pb-1.5" aria-hidden>
          {steps.map((step) => (
            <span
              key={step.id}
              className={cn(
                "size-2 rounded-full transition-colors duration-200",
                step.done ? "bg-primary" : "bg-foreground/15",
              )}
            />
          ))}
        </span>
      </div>
      <ol className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {steps.map((step, index) => {
          const next = step.id === nextId;
          return (
            <li key={step.id}>
              <a
                href={step.href}
                className="group/step flex items-center gap-3 px-4 py-3 outline-none first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                    step.done && "bg-primary text-primary-foreground",
                    next && "text-primary ring-2 ring-primary",
                    !step.done &&
                      !next &&
                      "text-muted-foreground ring-1 ring-foreground/15",
                  )}
                >
                  {step.done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step.done &&
                        "text-muted-foreground line-through decoration-foreground/20",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {step.description}
                  </span>
                </span>
                {next ? (
                  <ArrowRight className="size-4 shrink-0 text-primary transition-[translate] duration-150 group-hover/step:translate-x-0.5" />
                ) : null}
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
