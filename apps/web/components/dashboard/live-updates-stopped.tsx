"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LiveUpdatesStopped({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={cn("flex items-center gap-3 text-sm", className)}
    >
      <span>Live updates stopped. Reload the page to get them back.</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => window.location.reload()}
      >
        Reload
      </Button>
    </div>
  );
}
