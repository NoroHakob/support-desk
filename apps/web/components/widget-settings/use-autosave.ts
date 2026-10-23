"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

// Saves the newest value once changes pause for `delay` ms. Only one save runs
// at a time; a value scheduled meanwhile is saved right after it, so the last
// change always wins.
export function useAutosave<T>({
  save,
  delay,
}: {
  save: (value: T) => Promise<unknown>;
  delay: number;
}) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const saveRef = useRef(save);
  const pendingRef = useRef<{ value: T } | null>(null);
  const failedRef = useRef<{ value: T } | null>(null);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (inFlightRef.current || !pendingRef.current) {
      return;
    }
    inFlightRef.current = true;
    setStatus("saving");
    let next: { value: T } | null = pendingRef.current;
    while (next) {
      pendingRef.current = null;
      try {
        await saveRef.current(next.value);
        failedRef.current = null;
      } catch {
        failedRef.current = next;
      }
      next = pendingRef.current;
    }
    inFlightRef.current = false;
    setStatus(failedRef.current ? "failed" : "saved");
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pendingRef.current = { value };
      setStatus("saving");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  const retry = useCallback(() => {
    pendingRef.current ??= failedRef.current;
    void flush();
  }, [flush]);

  useEffect(() => {
    if (status !== "saving" && status !== "failed") {
      return;
    }
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return { status, schedule, retry };
}
