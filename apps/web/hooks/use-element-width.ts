import { useCallback, useState } from "react";

export function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState<number | null>(null);

  const ref = useCallback((node: T | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
