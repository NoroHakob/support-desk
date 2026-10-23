"use client";

import {
  assertNever,
  type Visitor,
  type VisitorDetails as Details,
} from "@marshaldesk/shared";
import {
  ArrowUpRight,
  Clock,
  Eye,
  Languages,
  Link2,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  type LucideIcon,
} from "lucide-react";

import { VisitorAvatar } from "@/components/inbox/visitor-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  formatAgo,
  formatDateTime,
  formatLocalTime,
  languageName,
} from "@/lib/format";
import { visitorTitle } from "@/lib/visitor";

function deviceIcon(device: Details["device"]): LucideIcon {
  switch (device) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    case "desktop":
    case null:
      return Monitor;
    default:
      return assertNever(device);
  }
}

function deviceLabel(details: Details) {
  const device = details.device
    ? details.device[0]?.toUpperCase() + details.device.slice(1)
    : null;
  const software =
    details.browser && details.os
      ? `${details.browser} on ${details.os}`
      : (details.browser ?? details.os);
  return [device, software].filter(Boolean).join(" · ") || "Unknown";
}

function pathOf(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
}

export function VisitorDetails({
  visitor,
  avatarUrl,
}: {
  visitor: Visitor;
  avatarUrl: string | undefined;
}) {
  const { details } = visitor;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col items-center gap-3 border-b px-4 pt-6 pb-5 text-center">
        <VisitorAvatar src={avatarUrl} className="size-16" />
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{visitorTitle(details)}</h2>
          <p className="text-xs text-muted-foreground">
            {details.visitCount === 1
              ? "First visit"
              : `${details.visitCount} visits`}
          </p>
        </div>
      </div>
      <dl className="divide-y">
        <Row icon={MapPin} label="Location">
          {visitorTitle(details) === "Visitor"
            ? "Unknown"
            : visitorTitle(details)}
        </Row>
        <Row icon={Clock} label="Local time">
          {details.timezone ? (
            <span suppressHydrationWarning>
              {formatLocalTime(details.timezone)}
              <span className="text-muted-foreground">
                {" "}
                · {details.timezone.replaceAll("_", " ")}
              </span>
            </span>
          ) : (
            "Unknown"
          )}
        </Row>
        <Row icon={Languages} label="Language">
          {details.language ? languageName(details.language) : "Unknown"}
        </Row>
        <Row icon={deviceIcon(details.device)} label="Device">
          {deviceLabel(details)}
        </Row>
        <Row icon={Link2} label="Current page">
          {details.page ? (
            <a
              href={details.page}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 hover:underline"
            >
              <span className="truncate">{pathOf(details.page)}</span>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
            </a>
          ) : (
            "Unknown"
          )}
        </Row>
        <Row icon={ArrowUpRight} label="Came from">
          {details.referrer ? pathOf(details.referrer) : "Direct visit"}
        </Row>
        <Row icon={Eye} label="Activity">
          <span
            className="flex flex-col"
            title={`First seen ${formatDateTime(visitor.firstSeenAt)}`}
            suppressHydrationWarning
          >
            <span>Last seen {formatAgo(visitor.lastSeenAt)}</span>
            <span className="text-muted-foreground">
              First seen {formatAgo(visitor.firstSeenAt)}
            </span>
          </span>
        </Row>
      </dl>
    </ScrollArea>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="min-w-0 truncate text-sm">{children}</dd>
      </div>
    </div>
  );
}
