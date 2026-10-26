import type { Defer } from "@/server/realtime/publish";

const JOBS_TIMEOUT_MS = 10_000;

let warnedMissingConfig = false;

/**
 * Asks the `jobs` Neon Function to do background work after the response is
 * sent. It answers 202 right away; a failed call is only logged, and the
 * function's schedule sweeps sources that never got processed.
 */
export function callJobs(
  defer: Defer | undefined,
  path: "/ingest/text" | "/suggested-questions",
  body: Record<string, string>,
) {
  // `neon env pull --service functions` writes the function's URL under its
  // own name; FUNCTIONS_URL overrides it.
  const baseUrl =
    process.env.FUNCTIONS_URL || process.env.NEON_FUNCTION_JOBS_BASE_URL;
  const secret = process.env.FUNCTIONS_SECRET;
  if (!baseUrl || !secret) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        "Background jobs are off: set FUNCTIONS_URL and FUNCTIONS_SECRET.",
      );
    }
    return;
  }
  (defer ?? ((task) => void task()))(async () => {
    try {
      const response = await fetch(new URL(path, baseUrl), {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(JOBS_TIMEOUT_MS),
      });
      if (!response.ok) {
        console.error(`Calling ${path} failed with status ${response.status}.`);
      }
    } catch (error) {
      console.error(`Calling ${path} failed.`, error);
    }
  });
}
