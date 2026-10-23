import type {
  AgentTurn,
  Conversation,
  Message,
  RetrievedChunk,
  Visitor,
} from "@marshaldesk/shared";

import { minutesAgo, mockId } from "@/lib/mock/ids";

const MODEL = "gemini-3.8-flash";

const mockGreeting =
  "Hi there! Ask me anything about our products, shipping or your account.";

const sources = {
  shipping: { id: mockId(401), name: "Shipping and returns.pdf" },
  pricing: { id: mockId(402), name: "Pricing.md" },
  account: { id: mockId(403), name: "Account help.txt" },
  hours: { id: mockId(404), name: "Opening hours" },
} as const;

type SourceRef = (typeof sources)[keyof typeof sources];

let nextId = 3000;

function message(
  at: Date,
  fields: Pick<Message, "author" | "body"> & Partial<Message>,
): Message {
  nextId += 1;
  return {
    id: mockId(nextId),
    memberId: null,
    attachments: [],
    classification: null,
    declined: false,
    systemEvent: null,
    agentTurn: null,
    sources: [],
    createdAt: at,
    ...fields,
  };
}

function chunk(source: SourceRef, score: number, used: boolean) {
  nextId += 1;
  return {
    chunkId: mockId(nextId),
    sourceId: source.id,
    sourceName: source.name,
    score,
    used,
  } satisfies RetrievedChunk;
}

function turn(
  fields: Pick<AgentTurn, "outcome"> & Partial<AgentTurn>,
): AgentTurn {
  nextId += 1;
  return {
    id: mockId(nextId),
    chunks: [],
    model: MODEL,
    tokensIn: 0,
    tokensOut: 0,
    latencyMs: 0,
    ...fields,
  };
}

function greeting(at: Date) {
  return message(at, {
    author: "system",
    systemEvent: "greeting",
    body: mockGreeting,
  });
}

function visitor(
  n: number,
  now: number,
  details: Partial<Visitor["details"]>,
  firstSeenMinutesAgo: number,
): Visitor {
  return {
    id: mockId(200 + n),
    details: {
      country: null,
      city: null,
      timezone: null,
      language: null,
      device: "desktop",
      browser: "Chrome",
      os: "macOS",
      page: "https://example.com/",
      referrer: null,
      visitCount: 1,
      ...details,
    },
    firstSeenAt: minutesAgo(now, firstSeenMinutesAgo),
    lastSeenAt: minutesAgo(now, 1),
  };
}

function conversation(
  n: number,
  fields: Omit<Conversation, "id" | "lastMessageAt" | "createdAt">,
): Conversation {
  const first = fields.messages[0];
  const last = fields.messages.at(-1);
  if (!first || !last) {
    throw new Error("A mock conversation needs at least one message.");
  }
  return {
    id: mockId(100 + n),
    createdAt: first.createdAt,
    lastMessageAt: last.createdAt,
    ...fields,
  };
}

export function getMockConversations(now = Date.now()): Conversation[] {
  nextId = 3000;
  const at = (minutes: number) => minutesAgo(now, minutes);

  return [
    conversation(1, {
      state: "waiting",
      handoffReason: "no_relevant_knowledge",
      closedAt: null,
      unread: true,
      visitor: visitor(
        1,
        now,
        {
          country: "DE",
          city: "Berlin",
          timezone: "Europe/Berlin",
          language: "de-DE",
          page: "https://example.com/integrations",
          referrer: "https://www.google.com/",
          visitCount: 3,
        },
        60 * 24 * 9,
      ),
      messages: [
        greeting(at(6)),
        message(at(5), {
          author: "visitor",
          body: "Do you integrate with Salesforce?",
          classification: "support_question",
          agentTurn: turn({
            outcome: "handed_off",
            chunks: [
              chunk(sources.pricing, 0.38, false),
              chunk(sources.account, 0.31, false),
            ],
            tokensIn: 405,
            tokensOut: 8,
            latencyMs: 640,
          }),
        }),
        message(at(5), {
          author: "agent",
          body: "I couldn't find that in our help content, so I'm bringing in a person from the team. They'll reply right here.",
        }),
        message(at(5), {
          author: "system",
          systemEvent: "handoff",
          body: "",
        }),
        message(at(2), {
          author: "visitor",
          body: "Thanks, I'll wait. We mostly need contacts to sync both ways.",
        }),
      ],
    }),
    conversation(2, {
      state: "waiting",
      handoffReason: "visitor_requested",
      closedAt: null,
      unread: true,
      visitor: visitor(
        2,
        now,
        {
          country: "FR",
          city: "Paris",
          timezone: "Europe/Paris",
          language: "fr-FR",
          device: "mobile",
          browser: "Safari",
          os: "iOS",
          page: "https://example.com/account/orders",
        },
        30,
      ),
      messages: [
        greeting(at(14)),
        message(at(13), {
          author: "visitor",
          body: "Can I talk to a real person please?",
          classification: "human_request",
          agentTurn: turn({
            outcome: "handed_off",
            tokensIn: 412,
            tokensOut: 9,
            latencyMs: 380,
          }),
        }),
        message(at(13), {
          author: "system",
          systemEvent: "handoff",
          body: "",
        }),
      ],
    }),
    conversation(3, {
      state: "waiting",
      handoffReason: "low_confidence",
      closedAt: null,
      unread: false,
      visitor: visitor(
        3,
        now,
        {
          country: "NL",
          city: "Amsterdam",
          timezone: "Europe/Amsterdam",
          language: "nl-NL",
          browser: "Firefox",
          os: "Windows",
          page: "https://example.com/help/returns",
          visitCount: 2,
        },
        60 * 24 * 3,
      ),
      messages: [
        greeting(at(48)),
        message(at(47), {
          author: "visitor",
          body: "My mug arrived with a crack. Can I get a replacement and keep the original?",
          classification: "support_question",
          agentTurn: turn({
            outcome: "handed_off",
            chunks: [
              chunk(sources.shipping, 0.61, true),
              chunk(sources.shipping, 0.47, true),
              chunk(sources.pricing, 0.29, false),
            ],
            tokensIn: 1_284,
            tokensOut: 42,
            latencyMs: 1_910,
          }),
        }),
        message(at(47), {
          author: "agent",
          body: "I'm sorry your mug arrived damaged. I'm not sure about keeping the original, so I'm bringing in a person who can sort this out for you.",
        }),
        message(at(47), {
          author: "system",
          systemEvent: "handoff",
          body: "",
        }),
      ],
    }),
    conversation(4, {
      state: "human",
      handoffReason: "low_confidence",
      closedAt: null,
      unread: true,
      visitor: visitor(
        4,
        now,
        {
          country: "CA",
          city: "Toronto",
          timezone: "America/Toronto",
          language: "en-CA",
          page: "https://example.com/pricing",
          referrer: "https://news.ycombinator.com/",
          visitCount: 5,
        },
        60 * 24 * 21,
      ),
      messages: [
        greeting(at(95)),
        message(at(94), {
          author: "visitor",
          body: "We're a team of 40. Is there a discount for annual billing?",
          classification: "support_question",
          agentTurn: turn({
            outcome: "handed_off",
            chunks: [
              chunk(sources.pricing, 0.66, true),
              chunk(sources.pricing, 0.44, true),
            ],
            tokensIn: 1_102,
            tokensOut: 38,
            latencyMs: 1_640,
          }),
        }),
        message(at(94), {
          author: "agent",
          body: "Annual billing is covered in our pricing, but I'm not sure about discounts for a team your size, so I'm bringing in a person.",
        }),
        message(at(94), {
          author: "system",
          systemEvent: "handoff",
          body: "",
        }),
        message(at(70), {
          author: "system",
          systemEvent: "taken_over",
          body: "",
        }),
        message(at(70), {
          author: "member",
          memberId: mockId(1),
          body: "Hi! For 40 seats on an annual plan we can do **15% off**. Want me to send a quote?",
        }),
        message(at(4), {
          author: "visitor",
          body: "Yes please, send it to our finance team.",
        }),
      ],
    }),
    conversation(5, {
      state: "ai",
      handoffReason: null,
      closedAt: null,
      unread: false,
      visitor: visitor(
        5,
        now,
        {
          country: "GB",
          city: "London",
          timezone: "Europe/London",
          language: "en-GB",
          browser: "Edge",
          os: "Windows",
          page: "https://example.com/account",
        },
        20,
      ),
      messages: [
        greeting(at(19)),
        message(at(18), {
          author: "visitor",
          body: "How do I reset my password?",
          classification: "support_question",
          agentTurn: turn({
            outcome: "answered",
            chunks: [
              chunk(sources.account, 0.82, true),
              chunk(sources.account, 0.57, true),
              chunk(sources.pricing, 0.21, false),
            ],
            tokensIn: 1_356,
            tokensOut: 96,
            latencyMs: 2_120,
          }),
        }),
        message(at(18), {
          author: "agent",
          body: "You can reset it in a minute:\n\n1. Go to **Sign in** and choose **Forgot password**.\n2. Enter your email address.\n3. Open the email we send and pick a new password.\n\nThe link in the email works for one hour.",
          sources: [sources.account],
        }),
        message(at(16), {
          author: "visitor",
          body: "Write me a poem about cats",
          classification: "off_topic",
          declined: true,
          agentTurn: turn({
            outcome: "declined",
            tokensIn: 398,
            tokensOut: 31,
            latencyMs: 520,
          }),
        }),
        message(at(16), {
          author: "agent",
          body: "That's not something I can help with here, but I'm happy to answer questions about your account, orders or our products.",
        }),
        message(at(15), {
          author: "visitor",
          body: "fair enough, thanks!",
          classification: "small_talk",
          agentTurn: turn({
            outcome: "replied",
            tokensIn: 402,
            tokensOut: 14,
            latencyMs: 410,
          }),
        }),
        message(at(15), {
          author: "agent",
          body: "You're welcome! Let me know if anything else comes up.",
        }),
      ],
    }),
    conversation(6, {
      state: "ai",
      handoffReason: null,
      closedAt: null,
      unread: false,
      visitor: visitor(
        6,
        now,
        {
          country: "US",
          city: "Austin",
          timezone: "America/Chicago",
          language: "en-US",
          device: "tablet",
          browser: "Safari",
          os: "iPadOS",
          page: "https://example.com/shop/espresso-cups",
          referrer: "https://www.instagram.com/",
        },
        12,
      ),
      messages: [
        greeting(at(9)),
        message(at(8), {
          author: "visitor",
          body: "Do you ship to Canada?",
          classification: "support_question",
          agentTurn: turn({
            outcome: "answered",
            chunks: [
              chunk(sources.shipping, 0.79, true),
              chunk(sources.shipping, 0.52, true),
            ],
            tokensIn: 1_198,
            tokensOut: 71,
            latencyMs: 1_780,
          }),
        }),
        message(at(8), {
          author: "agent",
          body: "Yes, we ship to Canada. Orders arrive in **5 to 8 business days**, and shipping is free on orders over $60.",
          sources: [sources.shipping],
        }),
      ],
    }),
    conversation(7, {
      state: "closed",
      handoffReason: null,
      closedAt: minutesAgo(now, 60 * 20),
      unread: false,
      visitor: visitor(
        7,
        now,
        {
          country: "ES",
          city: "Madrid",
          timezone: "Europe/Madrid",
          language: "es-ES",
          device: "mobile",
          browser: "Chrome",
          os: "Android",
          page: "https://example.com/help/refunds",
        },
        60 * 22,
      ),
      messages: [
        greeting(at(60 * 21)),
        message(at(60 * 21 - 1), {
          author: "visitor",
          body: "¿Cuál es su política de reembolsos?",
          classification: "support_question",
          agentTurn: turn({
            outcome: "answered",
            chunks: [
              chunk(sources.shipping, 0.74, true),
              chunk(sources.hours, 0.42, true),
            ],
            tokensIn: 1_244,
            tokensOut: 88,
            latencyMs: 1_950,
          }),
        }),
        message(at(60 * 21 - 1), {
          author: "agent",
          body: "Puedes devolver cualquier pedido en un plazo de **30 días** desde la entrega y te reembolsamos el importe completo. Escríbenos con tu número de pedido y te enviamos una etiqueta de devolución.",
          sources: [sources.shipping, sources.hours],
        }),
        message(at(60 * 20), {
          author: "system",
          systemEvent: "closed",
          body: "",
        }),
      ],
    }),
    conversation(8, {
      state: "closed",
      handoffReason: "agent_off",
      closedAt: minutesAgo(now, 60 * 24 * 5),
      unread: false,
      visitor: visitor(
        8,
        now,
        {
          country: "JP",
          city: "Tokyo",
          timezone: "Asia/Tokyo",
          language: "ja-JP",
          page: "https://example.com/",
        },
        60 * 24 * 7,
      ),
      messages: [
        greeting(at(60 * 24 * 7)),
        message(at(60 * 24 * 7 - 1), {
          author: "visitor",
          body: "Hello, are you open on public holidays?",
        }),
        message(at(60 * 24 * 7 - 1), {
          author: "system",
          systemEvent: "handoff",
          body: "",
        }),
        message(at(60 * 24 * 6), {
          author: "system",
          systemEvent: "taken_over",
          body: "",
        }),
        message(at(60 * 24 * 6), {
          author: "member",
          memberId: mockId(1),
          body: "Hi! We're closed on public holidays, but orders still ship the next working day.",
        }),
        message(at(60 * 24 * 5), {
          author: "system",
          systemEvent: "closed",
          body: "",
        }),
      ],
    }),
  ];
}
