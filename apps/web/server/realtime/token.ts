import {
  REALTIME_TOKEN_AUDIENCE,
  REALTIME_TOKEN_LIFETIME_SECONDS,
  type RealtimeTokenClaims,
} from "@marshaldesk/shared";
import { SignJWT } from "jose";

import { requireEnv } from "@/lib/env";

/** Opens one socket to the room the claims allow (checked by the Worker). */
export async function signRealtimeToken({
  sub,
  role,
  wid,
  cid,
}: RealtimeTokenClaims) {
  return new SignJWT({ role, wid, cid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setAudience(REALTIME_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${REALTIME_TOKEN_LIFETIME_SECONDS}s`)
    .sign(new TextEncoder().encode(requireEnv("REALTIME_TOKEN_SECRET")));
}
