import type { Source } from "@marshaldesk/shared";

/** Adds or replaces a source in a list; an older copy never wins. */
export function upsertSource(list: Source[] | undefined, source: Source) {
  if (!list) return list;
  const current = list.find((item) => item.id === source.id);
  if (!current) return [source, ...list];
  if (current.updatedAt > source.updatedAt) return list;
  return list.map((item) => (item.id === source.id ? source : item));
}
