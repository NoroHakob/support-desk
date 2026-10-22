import type { ComponentProps } from "react";

export function LogoMark(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5.5 3h13A3.5 3.5 0 0 1 22 6.5v8a3.5 3.5 0 0 1-3.5 3.5H10.4l-4.6 3.6a.5.5 0 0 1-.8-.4V18A3 3 0 0 1 2 15V6.5A3.5 3.5 0 0 1 5.5 3Z" />
      <g fill="var(--logo-dots, #fff)">
        <circle cx="7.5" cy="10.5" r="1.5" />
        <circle cx="12" cy="10.5" r="1.5" />
        <circle cx="16.5" cy="10.5" r="1.5" />
      </g>
    </svg>
  );
}
