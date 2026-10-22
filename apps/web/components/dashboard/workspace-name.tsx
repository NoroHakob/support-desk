"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

export function WorkspaceName() {
  const { data: workspace } = useSuspenseQuery(
    orpc.workspace.current.queryOptions(),
  );
  return workspace?.name ?? null;
}
