import { OWNER_NOT_APPROVED_MESSAGE } from "@marshaldesk/shared";
import * as z from "zod";

import { isApprovedOwner } from "@/lib/auth/owners";
import { auth } from "@/lib/auth/server";

const handlers = auth.handler();

// Requests that create an account or email a code (sign-in codes create the
// account too). They're checked before Neon Auth sees them, so an unapproved
// email gets neither. Google sign-in can't be checked here; sessionProcedure
// and the dashboard turn those accounts away instead.
const GATED_PATHS = new Set([
  "sign-up/email",
  "email-otp/send-verification-otp",
]);

const emailBodySchema = z.object({ email: z.string() });

async function isUnapprovedRequest(request: Request, path: string) {
  if (!GATED_PATHS.has(path)) return false;
  try {
    const body = emailBodySchema.safeParse(await request.clone().json());
    // Anything malformed goes on to Neon Auth, which rejects it.
    return body.success && !isApprovedOwner(body.data.email);
  } catch {
    return false;
  }
}

export const { GET, PUT, DELETE, PATCH } = handlers;

export async function POST(
  request: Request,
  context: Parameters<typeof handlers.POST>[1],
) {
  const { path } = await context.params;
  if (await isUnapprovedRequest(request, path.join("/"))) {
    return Response.json(
      { code: "EMAIL_NOT_APPROVED", message: OWNER_NOT_APPROVED_MESSAGE },
      { status: 403 },
    );
  }
  return handlers.POST(request, context);
}
