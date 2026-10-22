"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { authErrorMessage } from "@/components/auth/auth-error";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function GoogleButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    // The callback must be a page covered by proxy.ts: the middleware swaps
    // Neon's OAuth verifier for the session cookie there.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/dashboard`,
    });
    if (error) {
      setPending(false);
      onError(authErrorMessage(error));
    }
  }

  return (
    <Button
      type="button"
      variant="form-secondary"
      size="field"
      className="w-full"
      disabled={pending}
      onClick={signIn}
    >
      {pending ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M21.35 11.1H12.2v2.98h5.24c-.23 1.4-1.66 4.1-5.24 4.1-3.15 0-5.72-2.61-5.72-5.83s2.57-5.83 5.72-5.83c1.79 0 2.99.76 3.68 1.42l2.5-2.42C16.77 4.04 14.7 3.1 12.2 3.1 7.12 3.1 3 7.22 3 12.35s4.12 9.25 9.2 9.25c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51Z" />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
