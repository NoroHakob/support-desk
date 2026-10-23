export function isUniqueViolation(error: unknown): boolean {
  let current = error;
  while (typeof current === "object" && current !== null) {
    if (
      ("sqlState" in current && current.sqlState === "23505") ||
      ("code" in current && current.code === "23505")
    ) {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}
