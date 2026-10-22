import { emailSchema } from "@marshaldesk/shared";

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function emailParam(value: string | string[] | undefined) {
  const result = emailSchema.safeParse(firstParam(value));
  return result.success ? result.data : null;
}
