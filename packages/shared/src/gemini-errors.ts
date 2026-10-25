// Shared by the agent (apps/web) and the jobs function (apps/functions). Kept
// out of the main entry, so client bundles don't pull in the AI SDK.

import { APICallError } from "ai";

/** Whether Gemini turned a call down for quota or rate limits (HTTP 429). */
export function isQuotaError(error: unknown) {
  return APICallError.isInstance(error) && error.statusCode === 429;
}

/** Whether Gemini was temporarily overloaded (HTTP 503, "high demand"). */
export function isOverloadError(error: unknown) {
  return (
    APICallError.isInstance(error) &&
    error.statusCode !== 429 &&
    (error.statusCode === 503 || /high demand/i.test(error.message))
  );
}
