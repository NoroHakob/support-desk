"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  TEXT_SOURCE_MAX_LENGTH,
  textSourceInputSchema,
  type Source,
  type TextSourceInput,
} from "@marshaldesk/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatInteger } from "@/lib/format";
import { client, orpc } from "@/lib/orpc";
import { upsertSource } from "@/lib/sources";

/** Adds a text source, or edits one when `sourceId` is set (PRD K-2). */
export function TextSourceForm({
  sourceId,
  defaultValues,
  onSaved,
  onCancel,
}: {
  sourceId?: string;
  defaultValues?: TextSourceInput;
  onSaved: (source: Source) => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextSourceInput>({
    resolver: zodResolver(textSourceInputSchema),
    defaultValues: defaultValues ?? { name: "", text: "" },
  });
  const text = useWatch({ control, name: "text" });

  const save = useMutation({
    mutationFn: (input: TextSourceInput) =>
      sourceId
        ? client.knowledge.updateTextSource({ id: sourceId, ...input })
        : client.knowledge.createTextSource(input),
    onSuccess: (source) => {
      queryClient.setQueryData(orpc.knowledge.sources.queryKey(), (list) =>
        upsertSource(list, source),
      );
      onSaved(source);
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((input) => save.mutate(input))}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="text-source-name">Title</Label>
        <Input
          id="text-source-name"
          className="h-9"
          autoComplete="off"
          placeholder="Shipping and returns"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="text-source-text">Text</Label>
        <Textarea
          id="text-source-text"
          rows={12}
          className="max-h-[50vh] resize-y"
          placeholder="Write or paste what the agent should know. Markdown headings help it find the right part."
          aria-invalid={!!errors.text}
          {...register("text")}
        />
        <div className="flex justify-between gap-4">
          <FieldError errors={[errors.text]} />
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {formatInteger(text.length)}/{formatInteger(TEXT_SOURCE_MAX_LENGTH)}
          </span>
        </div>
      </div>
      {save.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t save this source. Try again.
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {sourceId ? "Save and process again" : "Add source"}
        </Button>
      </div>
    </form>
  );
}
