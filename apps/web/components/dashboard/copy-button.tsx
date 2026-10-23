"use client";

import { Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "@/components/dashboard/icon-button";

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <IconButton
      label={copied ? "Copied" : label}
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path
            d="M20 6 9 17l-5-5"
            pathLength={1}
            className="animate-draw [stroke-dasharray:1] motion-reduce:animate-none"
          />
        </svg>
      ) : (
        <Copy />
      )}
    </IconButton>
  );
}
