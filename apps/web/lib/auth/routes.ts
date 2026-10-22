export function verifyEmailHref(email: string) {
  return `/auth/verify-email?email=${encodeURIComponent(email)}`;
}

export function resetPasswordHref(email: string) {
  return `/auth/reset-password?email=${encodeURIComponent(email)}`;
}
