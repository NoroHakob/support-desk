import { Streamdown } from "streamdown";

export function MessageMarkdown({ body }: { body: string }) {
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
