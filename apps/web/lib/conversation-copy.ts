import {
  assertNever,
  type AgentOutcome,
  type Classification,
  type ConversationState,
  type HandoffReason,
  type SystemEvent,
} from "@marshaldesk/shared";

export const conversationStates = [
  "waiting",
  "ai",
  "human",
  "closed",
] as const satisfies readonly ConversationState[];

export function stateLabel(state: ConversationState) {
  switch (state) {
    case "ai":
      return "Agent";
    case "waiting":
      return "Waiting";
    case "human":
      return "You";
    case "closed":
      return "Closed";
    default:
      return assertNever(state);
  }
}

export function handoffReasonText(reason: HandoffReason) {
  switch (reason) {
    case "low_confidence":
      return "The agent wasn't sure of the answer.";
    case "no_relevant_knowledge":
      return "The agent found nothing about this in your knowledge base.";
    case "visitor_requested":
      return "The visitor asked for a person.";
    case "agent_off":
      return "The agent is off, so the conversation came straight to you.";
    default:
      return assertNever(reason);
  }
}

export function systemEventText(
  event: Exclude<SystemEvent, "greeting">,
  reason: HandoffReason | null,
) {
  switch (event) {
    case "handoff":
      return reason
        ? `Handed to you. ${handoffReasonText(reason)}`
        : "Handed to you.";
    case "taken_over":
      return "You took over the conversation.";
    case "handed_back":
      return "You handed the conversation back to the agent.";
    case "closed":
      return "The conversation was closed.";
    default:
      return assertNever(event);
  }
}

export function classificationLabel(classification: Classification) {
  switch (classification) {
    case "support_question":
      return "Support question";
    case "small_talk":
      return "Small talk";
    case "off_topic":
      return "Off-topic message";
    case "human_request":
      return "Request for a human";
    default:
      return assertNever(classification);
  }
}

export function outcomeText(outcome: AgentOutcome, usedSources: number) {
  switch (outcome) {
    case "answered":
      return usedSources === 1
        ? "Answered from 1 source."
        : `Answered from ${usedSources} sources.`;
    case "replied":
      return "Replied briefly, without searching the knowledge base.";
    case "declined":
      return "Declined politely. Retrieval and the answer model were skipped.";
    case "handed_off":
      return "Handed the conversation to you.";
    default:
      return assertNever(outcome);
  }
}
