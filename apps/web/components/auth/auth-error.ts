const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  USER_ALREADY_EXISTS:
    "An account with this email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists. Sign in instead.",
  INVALID_OTP: "That code isn't right. Check it and try again.",
  OTP_EXPIRED: "That code has expired. Ask for a new one.",
  TOO_MANY_ATTEMPTS: "Too many tries. Ask for a new code.",
};

export function authErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  return (
    (error.code && messages[error.code]) ||
    error.message ||
    "Something went wrong. Try again."
  );
}
