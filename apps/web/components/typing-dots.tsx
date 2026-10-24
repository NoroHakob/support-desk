import { cn } from "cn";

// The brand's three dots (DESIGN.md), standing still: nothing loops.
export function TypingDots({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex items-center gap-1", className)}
    >
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="size-1.5 rounded-full bg-current" />
      ))}
    </span>
  );
}
