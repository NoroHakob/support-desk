"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Sent at most this often while typing continues.
const RESEND_AFTER_MS = 2500;
// Typing stops after this long without a keystroke.
const IDLE_AFTER_MS = 3000;
// The indicator hides if the other side goes quiet without saying so (a
// dropped connection, a closed tab).
const EXPIRE_AFTER_MS = 6000;

/** Turns keystrokes into a few typing events for the other side (PRD W-11). */
export function useTypingSender(send: (typing: boolean) => void) {
  const lastSentRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  const stop = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
    if (lastSentRef.current !== 0) {
      lastSentRef.current = 0;
      sendRef.current(false);
    }
  }, []);

  const onInput = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current > RESEND_AFTER_MS) {
      lastSentRef.current = now;
      sendRef.current(true);
    }
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stop, IDLE_AFTER_MS);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { onInput, stop };
}

/** Whether the other side is typing right now. */
export function useRemoteTyping() {
  const [typing, setTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((next: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = next
      ? setTimeout(() => setTyping(false), EXPIRE_AFTER_MS)
      : null;
    setTyping(next);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { typing, update };
}
