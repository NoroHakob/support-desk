import type { WidgetSettings } from "@marshaldesk/shared";

export const mockGreeting =
  "Hi there! Ask me anything about our products, shipping or your account.";

export function getMockWidgetSettings(workspaceName: string): WidgetSettings {
  return {
    position: "bottom-right",
    color: "blue",
    agentName: `${workspaceName} Agent`,
    agentAvatarUrl: null,
    greeting: mockGreeting,
    allowedDomains: ["example.com"],
    suggestedQuestions: [
      "Do you ship internationally?",
      "How do I reset my password?",
      "What's included in the Pro plan?",
      "How do refunds work?",
    ],
    snippetInstalled: false,
  };
}
