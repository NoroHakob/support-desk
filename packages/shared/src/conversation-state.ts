import { assertNever } from "./assert-never";
import type {
  ConversationState,
  HandoffReason,
  SystemEvent,
} from "./conversation";

export type ConversationAction =
  "take_over" | "reply" | "hand_back" | "close" | "request_human";

export type Transition = {
  state: ConversationState;
  // The notice to add before the action's own message, if any.
  systemEvent: SystemEvent | null;
  // Only set when the conversation moves to `waiting`.
  handoffReason: HandoffReason | null;
};

/** PRD Flow C. Returns null when the action isn't allowed in `state`. */
export function nextState(
  state: ConversationState,
  action: ConversationAction,
): Transition | null {
  switch (action) {
    case "take_over":
    case "reply":
      switch (state) {
        case "ai":
        case "waiting":
          return {
            state: "human",
            systemEvent: "taken_over",
            handoffReason: null,
          };
        case "human":
          return action === "reply"
            ? { state: "human", systemEvent: null, handoffReason: null }
            : null;
        case "closed":
          return null;
        default:
          return assertNever(state);
      }
    case "hand_back":
      switch (state) {
        case "human":
          return {
            state: "ai",
            systemEvent: "handed_back",
            handoffReason: null,
          };
        case "ai":
        case "waiting":
        case "closed":
          return null;
        default:
          return assertNever(state);
      }
    case "close":
      switch (state) {
        case "ai":
        case "waiting":
        case "human":
          return {
            state: "closed",
            systemEvent: "closed",
            handoffReason: null,
          };
        case "closed":
          return null;
        default:
          return assertNever(state);
      }
    case "request_human":
      switch (state) {
        case "ai":
          return {
            state: "waiting",
            systemEvent: "handoff",
            handoffReason: "visitor_requested",
          };
        case "waiting":
        case "human":
        case "closed":
          return null;
        default:
          return assertNever(state);
      }
    default:
      return assertNever(action);
  }
}
