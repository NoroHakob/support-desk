import { isAuthError } from "@neondatabase/auth/next";

type AuthErrorLike = { code?: string; message?: string };

// Better Auth's codes, plus the snake_case codes Neon Auth's client puts on
// the errors it throws (it normalizes the ones it knows).
const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  invalid_credentials: "That email and password don't match.",
  USER_ALREADY_EXISTS:
    "An account with this email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists. Sign in instead.",
  user_already_exists:
    "An account with this email already exists. Sign in instead.",
  INVALID_OTP: "That code isn't right. Check it and try again.",
  OTP_EXPIRED: "That code has expired. Ask for a new one.",
  TOO_MANY_ATTEMPTS: "Too many tries. Ask for a new code.",
  over_request_rate_limit: "Too many tries. Wait a moment and try again.",
  over_email_send_rate_limit:
    "Too many emails sent. Wait a moment and try again.",
};

// Codes Neon Auth doesn't know are replaced, but the message survives.
const messagesByText: Record<string, string> = {
  "Invalid OTP": "That code isn't right. Check it and try again.",
  "OTP expired": "That code has expired. Ask for a new one.",
  "Too many attempts": "Too many tries. Ask for a new code.",
};

export function authErrorMessage(error: AuthErrorLike): string {
  return (
    (error.code && messages[error.code]) ||
    (error.message && messagesByText[error.message]) ||
    error.message ||
    "Something went wrong. Try again."
  );
}

export function isEmailNotVerified(error: AuthErrorLike) {
  return (
    error.code === "EMAIL_NOT_VERIFIED" || error.code === "email_not_confirmed"
  );
}

/**
 * Neon Auth's client throws an AuthApiError for every non-2xx response
 * instead of returning `{ error }`, both for its own errors and for the
 * owner allowlist in /api/auth. This hands it back as `{ error }`, so forms
 * show it like any other auth error.
 */
export async function authCall<Result extends { error: unknown }>(
  call: Promise<Result>,
): Promise<Result | { data: null; error: AuthErrorLike }> {
  try {
    return await call;
  } catch (error) {
    if (!isAuthError(error)) throw error;
    return { data: null, error: { code: error.code, message: error.message } };
  }
}
