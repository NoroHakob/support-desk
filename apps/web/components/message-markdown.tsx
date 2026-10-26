import { Streamdown } from "streamdown";

// Visitors write Markdown too, and Streamdown loads any image URL by default,
// which would let a visitor load a tracker in the owner's dashboard.
const DISALLOWED_ELEMENTS = ["img"];

export function MessageMarkdown({ body }: { body: string }) {
  return (
    <Streamdown
      mode="static"
      controls={false}
      disallowedElements={DISALLOWED_ELEMENTS}
      className="text-sm leading-relaxed wrap-break-word [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    >
      {body}
    </Streamdown>
  );
}
