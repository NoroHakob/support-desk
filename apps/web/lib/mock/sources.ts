import type { Source } from "@marshaldesk/shared";

import { minutesAgo, mockId } from "@/lib/mock/ids";

export const mockSourceIds = {
  shipping: mockId(401),
  pricing: mockId(402),
  account: mockId(403),
  hours: mockId(404),
  brand: mockId(405),
  faq: mockId(406),
} as const;

export function getMockSources(now = Date.now()): Source[] {
  return [
    {
      id: mockSourceIds.shipping,
      kind: "file",
      name: "Shipping and returns.pdf",
      mime: "application/pdf",
      size: 284_000,
      status: "ready",
      error: null,
      createdAt: minutesAgo(now, 60 * 24 * 6),
      updatedAt: minutesAgo(now, 60 * 24 * 6),
    },
    {
      id: mockSourceIds.pricing,
      kind: "file",
      name: "Pricing.md",
      mime: "text/markdown",
      size: 6_200,
      status: "ready",
      error: null,
      createdAt: minutesAgo(now, 60 * 24 * 4),
      updatedAt: minutesAgo(now, 60 * 24 * 4),
    },
    {
      id: mockSourceIds.account,
      kind: "file",
      name: "Account help.txt",
      mime: "text/plain",
      size: 3_900,
      status: "ready",
      error: null,
      createdAt: minutesAgo(now, 60 * 24 * 2),
      updatedAt: minutesAgo(now, 60 * 24 * 2),
    },
    {
      id: mockSourceIds.hours,
      kind: "text",
      name: "Opening hours",
      mime: null,
      size: null,
      status: "ready",
      error: null,
      createdAt: minutesAgo(now, 60 * 5),
      updatedAt: minutesAgo(now, 60 * 5),
    },
    {
      id: mockSourceIds.brand,
      kind: "file",
      name: "Product catalogue.pdf",
      mime: "application/pdf",
      size: 4_800_000,
      status: "processing",
      error: null,
      createdAt: minutesAgo(now, 2),
      updatedAt: minutesAgo(now, 1),
    },
    {
      id: mockSourceIds.faq,
      kind: "file",
      name: "Old FAQ.pdf",
      mime: "application/pdf",
      size: 1_100_000,
      status: "failed",
      error:
        "We couldn't find any text in this PDF. It may be a scanned image.",
      createdAt: minutesAgo(now, 60 * 26),
      updatedAt: minutesAgo(now, 60 * 26),
    },
  ];
}
