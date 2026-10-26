// Only these emails may sign up, create a workspace or open the dashboard
// (docs/MY-CHANGES.md section 10). Visitors never pass through here. Server
// only: OWNER_EMAILS isn't a public variable.

function ownerEmails() {
  return (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Whether an owner's email is on the allowlist. Without OWNER_EMAILS,
 * everyone is allowed outside production and nobody in it.
 */
export function isApprovedOwner(email: string) {
  const emails = ownerEmails();
  if (emails.length === 0) {
    return process.env.NODE_ENV !== "production";
  }
  return emails.includes(email.trim().toLowerCase());
}
