import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";
import * as z from "zod";

import { requireEnv } from "@/lib/env";

const AUDIENCE = "widget";
const LIFETIME = "30d";
const REISSUE_AFTER_SECONDS = 24 * 60 * 60;

const claimsSchema = z.object({
  sub: z.uuid(),
  wid: z.uuid(),
  host: z.string(),
  vsk: z.string().min(1),
  iat: z.number(),
});

export type VisitorTokenClaims = z.infer<typeof claimsSchema>;

function secretKey() {
  return new TextEncoder().encode(requireEnv("VISITOR_TOKEN_SECRET"));
}

/** A random per-visitor secret. Only its hash is stored. */
export function newVisitorSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashVisitorSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function visitorSecretMatches(secret: string, storedHash: string) {
  const actual = Buffer.from(hashVisitorSecret(secret), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function signVisitorToken({
  visitorId,
  workspaceId,
  host,
  secret,
}: {
  visitorId: string;
  workspaceId: string;
  host: string;
  secret: string;
}) {
  return new SignJWT({ wid: workspaceId, host, vsk: secret })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(visitorId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(secretKey());
}

/** Returns null for a missing, forged, expired or malformed token. */
export async function verifyVisitorToken(
  token: string,
): Promise<VisitorTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    const parsed = claimsSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function needsReissue(claims: VisitorTokenClaims, host: string) {
  return (
    claims.host !== host ||
    Date.now() / 1000 - claims.iat > REISSUE_AFTER_SECONDS
  );
}
