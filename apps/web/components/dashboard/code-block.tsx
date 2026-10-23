import { cn } from "cn";
import { createCssVariablesTheme, getSingletonHighlighter } from "shiki";

import { CopyButton } from "@/components/dashboard/copy-button";

const theme = createCssVariablesTheme({ name: "code-block" });

const languages = ["html"] as const;

export async function CodeBlock({
  code,
  language,
  filename,
  className,
}: {
  code: string;
  language: (typeof languages)[number];
  filename?: string;
  className?: string;
}) {
  const highlighter = await getSingletonHighlighter({
    themes: [theme],
    langs: [...languages],
  });
  const { tokens } = highlighter.codeToTokens(code, {
    lang: language,
    theme: "code-block",
  });

  return (
    <div
      className={cn(
        "code-block dark overflow-hidden rounded-xl bg-ink text-ink-foreground ring-1 ring-white/10",
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between gap-2 border-b border-white/10 pr-1.5 pl-4">
        <span className="font-mono text-xs text-ink-foreground/60">
          {filename ?? language}
        </span>
        <CopyButton
          value={code}
          label="Copy snippet"
          className="text-ink-foreground/70 hover:bg-white/10 hover:text-white"
        />
      </div>
      <pre className="overflow-x-auto py-3 font-mono text-[13px] leading-6">
        <code className="grid">
          {tokens.map((line, index) => (
            <span key={index} className="flex pr-4">
              <span
                aria-hidden
                className="w-10 shrink-0 pr-4 text-right text-ink-foreground/30 select-none"
              >
                {index + 1}
              </span>
              <span>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} style={{ color: token.color }}>
                    {token.content}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
