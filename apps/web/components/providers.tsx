"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";

import { getBrowserQueryClient } from "@/lib/query/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getBrowserQueryClient();
  // The widget sits on customers' sites, so it doesn't follow the visitor's
  // dark mode.
  const forcedTheme = usePathname().startsWith("/widget/")
    ? "light"
    : undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={forcedTheme}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
