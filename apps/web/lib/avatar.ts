import { notionistsNeutral } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

export function memberAvatarUri(seed: string) {
  return createAvatar(notionistsNeutral, { seed }).toDataUri();
}
