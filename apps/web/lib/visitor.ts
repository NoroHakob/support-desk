import {
  assertNever,
  type Conversation,
  type VisitorDetails,
} from "@marshaldesk/shared";

import { countryName } from "@/lib/format";

export function visitorTitle(details: VisitorDetails) {
  const country = details.country ? countryName(details.country) : null;
  if (details.city && country) return `${details.city}, ${country}`;
  return details.city ?? country ?? "Visitor";
}

function plainText(markdown: string) {
  return markdown
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function lastMessagePreview(conversation: Conversation) {
  const message = conversation.messages.findLast(
    (item) => item.author !== "system",
  );
  if (!message) return "";
  switch (message.author) {
    case "visitor":
      return plainText(message.body);
    case "agent":
      return `Agent: ${plainText(message.body)}`;
    case "member":
      return `You: ${plainText(message.body)}`;
    case "system":
      return "";
    default:
      return assertNever(message.author);
  }
}
