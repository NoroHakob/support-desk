"use client";

import { useCallback, useSyncExternalStore } from "react";

export function MediaQueryGate({
  query,
  children,
}: {
  query: string;
  children: React.ReactNode;
}) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const matches = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );

  return matches ? children : null;
}
