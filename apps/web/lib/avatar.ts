import { glass, notionistsNeutral, thumbs } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

export function memberAvatarUri(seed: string) {
  return createAvatar(notionistsNeutral, { seed }).toDataUri();
}

export function agentAvatarUri(seed: string, colorHex: string) {
  return createAvatar(glass, {
    seed,
    backgroundColor: [colorHex.replace("#", "")],
  }).toDataUri();
}

export function visitorAvatarUri(visitorId: string) {
  return createAvatar(thumbs, { seed: visitorId }).toDataUri();
}
