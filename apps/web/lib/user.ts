export function displayName(user: { name: string; email: string }) {
  return user.name.trim() || user.email.split("@")[0] || user.email;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
