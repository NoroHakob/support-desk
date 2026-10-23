// Stable, valid UUIDs for mock rows, readable by their number.
export function mockId(n: number) {
  return `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
}

export function minutesAgo(now: number, minutes: number) {
  return new Date(now - minutes * 60_000);
}
