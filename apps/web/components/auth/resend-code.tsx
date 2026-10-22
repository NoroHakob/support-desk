"use client";

import { useEffect, useState } from "react";

import { FieldDescription } from "@/components/ui/field";

const COOLDOWN_SECONDS = 60;

export function ResendCode({
  onResend,
}: {
  onResend: () => Promise<string | null>;
}) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    setSending(true);
    setMessage(null);
    const error = await onResend();
    setSending(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage("We sent you a new code.");
    setSecondsLeft(COOLDOWN_SECONDS);
  }

  return (
    <FieldDescription className="text-center" aria-live="polite">
      {message && <span className="block">{message}</span>}
      {secondsLeft > 0 ? (
        <>You can ask for a new code in {secondsLeft}s.</>
      ) : (
        <>
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="underline underline-offset-4 hover:text-foreground disabled:opacity-50"
          >
            Send a new code
          </button>
        </>
      )}
    </FieldDescription>
  );
}
