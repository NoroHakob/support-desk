"use client";

import type { Source } from "@marshaldesk/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orpc } from "@/lib/orpc";

export function DeleteSourceDialog({
  source,
  onOpenChange,
}: {
  source: Source | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const remove = useMutation(
    orpc.knowledge.deleteSource.mutationOptions({
      onSuccess: (_, input) => {
        queryClient.setQueryData(orpc.knowledge.sources.queryKey(), (list) =>
          list?.filter((item) => item.id !== input.id),
        );
        onOpenChange(false);
      },
    }),
  );

  return (
    <Dialog
      open={source !== null}
      onOpenChange={(open) => {
        if (!open) remove.reset();
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {source?.name}?</DialogTitle>
          <DialogDescription>
            The agent stops using it right away. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        {remove.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t delete this source. Try again.
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending || !source}
            onClick={() => source && remove.mutate({ id: source.id })}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
