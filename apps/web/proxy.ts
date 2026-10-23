import { findWidgetSettings } from "@marshaldesk/db";
import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";

import { auth } from "@/lib/auth/server";
import { frameAncestors } from "@/server/widget/hosts";

const authProxy = auth.middleware({ loginUrl: "/auth/sign-in" });

// Browsers refuse to render the widget iframe on any site that isn't one of
// the workspace's allowed domains (PRD W-2, section 10).
async function widgetProxy(request: NextRequest) {
  const workspaceId = request.nextUrl.pathname.split("/")[2];
  const parsed = z.uuid().safeParse(workspaceId);
  const settings = parsed.success
    ? await findWidgetSettings(parsed.data)
    : null;
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    `frame-ancestors ${settings ? frameAncestors(settings.allowedDomains) : "'none'"}`,
  );
  return response;
}

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/widget/")) {
    return widgetProxy(request);
  }
  return authProxy(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/welcome", "/widget/:path*"],
};
