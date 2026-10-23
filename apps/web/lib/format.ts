const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const regionNames = new Intl.DisplayNames("en", { type: "region" });
const languageNames = new Intl.DisplayNames("en", { type: "language" });
const shortDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
});
const dateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});
const integer = new Intl.NumberFormat("en");

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatShortAgo(date: Date, now = Date.now()) {
  const diff = Math.max(0, now - date.getTime());
  if (diff < MINUTE) return "now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  return shortDate.format(date);
}

export function formatAgo(date: Date, now = Date.now()) {
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  if (abs < MINUTE) return "just now";
  if (abs < HOUR) return relative.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return relative.format(Math.round(diff / HOUR), "hour");
  return relative.format(Math.round(diff / DAY), "day");
}

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

export function formatLocalTime(timeZone: string, now = Date.now()) {
  return new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    timeZone,
  }).format(now);
}

export function countryName(code: string) {
  return regionNames.of(code) ?? code;
}

export function languageName(tag: string) {
  return languageNames.of(tag) ?? tag;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatInteger(value: number) {
  return integer.format(value);
}

export function formatDuration(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}
