"use client";

import { widgetColorHex, type WidgetColor } from "@marshaldesk/shared";
import { createContext, use, useState } from "react";

type AccentContextValue = {
  color: WidgetColor;
  setColor: (color: WidgetColor) => void;
};

const AccentContext = createContext<AccentContextValue | null>(null);

export function DashboardAccentProvider({
  initialColor,
  children,
}: {
  initialColor: WidgetColor;
  children: React.ReactNode;
}) {
  const [color, setColor] = useState(initialColor);

  return (
    <AccentContext value={{ color, setColor }}>
      <div
        className="contents"
        style={
          {
            "--brand": widgetColorHex[color],
            "--primary": "var(--brand)",
            "--primary-foreground": "#ffffff",
            "--ring": "var(--brand)",
            "--sidebar-primary": "var(--brand)",
            "--sidebar-primary-foreground": "#ffffff",
            "--sidebar-ring": "var(--brand)",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </AccentContext>
  );
}

export function useDashboardAccent() {
  const value = use(AccentContext);
  if (!value) {
    throw new Error(
      "useDashboardAccent must be used inside DashboardAccentProvider.",
    );
  }
  return value;
}
