import type { RealtimeParty } from "./realtime";

const PUBLISH_TIMEOUT_MS = 2000;

/**
 * POSTs one encoded event to a room on the real-time Worker. The write it
 * reports is already saved, so a failure is only logged: clients catch up
 * from the API when they reconnect.
 */
export async function sendRealtimeEvent({
  baseUrl,
  secret,
  party,
  room,
  body,
}: {
  baseUrl: string;
  secret: string;
  party: RealtimeParty;
  room: string;
  body: string;
}) {
  try {
    const response = await fetch(
      new URL(`/parties/${party}/${room}`, baseUrl),
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      console.error(
        `Publishing to ${party}/${room} failed with status ${response.status}.`,
      );
    }
  } catch (error) {
    console.error(`Publishing to ${party}/${room} failed.`, error);
  }
}
