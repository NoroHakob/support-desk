import { assertNever, type SystemEvent } from "@marshaldesk/shared";

/** What the visitor sees for a notice in the conversation (PRD Flow C). */
export function widgetNoticeText(event: Exclude<SystemEvent, "greeting">) {
  switch (event) {
    case "handoff":
      return "You'll be connected to a person shortly. It can take a little while, so please hang on.";
    case "taken_over":
      return "A person from the team joined the conversation.";
    case "handed_back":
      return "You're now chatting with the AI agent.";
    case "closed":
      return "This conversation has ended. Send a message to start a new one.";
    default:
      return assertNever(event);
  }
}
