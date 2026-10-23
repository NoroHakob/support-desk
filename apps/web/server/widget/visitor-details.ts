import type { VisitorDetailsUpdate } from "@marshaldesk/db";
import type { VisitorContext } from "@marshaldesk/shared";
import { geolocation } from "@vercel/functions";
import { UAParser } from "ua-parser-js";

function deviceType(type: string | undefined): VisitorDetailsUpdate["device"] {
  switch (type) {
    case undefined:
      return "desktop";
    case "mobile":
    case "tablet":
      return type;
    default:
      return null;
  }
}

function decoded(value: string | undefined) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Country and city come from the headers Vercel adds; the IP itself is never
// read or stored. Locally there are no such headers, so both stay empty.
export function visitorDetails(
  requestHeaders: Headers,
  context: VisitorContext,
): VisitorDetailsUpdate {
  const geo = geolocation({ headers: requestHeaders });
  const agent = UAParser(requestHeaders.get("user-agent") ?? "");
  return {
    country: geo.country ?? null,
    city: decoded(geo.city),
    timezone: context.timezone,
    language: context.language,
    device: deviceType(agent.device.type),
    browser: agent.browser.name ?? null,
    os: agent.os.name ?? null,
    page: context.page,
    referrer: context.referrer,
  };
}
