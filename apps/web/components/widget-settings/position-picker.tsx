"use client";

import { widgetPositionSchema, type WidgetPosition } from "@marshaldesk/shared";
import { cn } from "cn";

import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const labels: Record<WidgetPosition, string> = {
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

export function PositionPicker({
  value,
  onChange,
}: {
  value: WidgetPosition;
  onChange: (value: WidgetPosition) => void;
}) {
  return (
    <RadioGroup
      aria-label="Position"
      value={value}
      onValueChange={(next) => onChange(widgetPositionSchema.parse(next))}
      className="grid-cols-2 gap-3"
    >
      {widgetPositionSchema.options.map((position) => (
        <FieldLabel key={position} htmlFor={`position-${position}`}>
          <Field orientation="horizontal" className="gap-3">
            <FieldContent className="gap-2">
              <PositionIllustration position={position} />
              <FieldTitle>{labels[position]}</FieldTitle>
            </FieldContent>
            <RadioGroupItem value={position} id={`position-${position}`} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  );
}

function PositionIllustration({ position }: { position: WidgetPosition }) {
  const left = position === "bottom-left";
  return (
    <span
      aria-hidden
      className="relative flex h-16 w-full flex-col justify-end gap-1 rounded-md bg-muted p-1.5"
    >
      <span className="absolute top-2 left-2 h-1.5 w-8 rounded-full bg-foreground/10" />
      <span className="absolute top-5 left-2 h-1.5 w-12 rounded-full bg-foreground/8" />
      <span
        className={cn(
          "flex flex-col gap-1",
          left ? "items-start" : "items-end",
        )}
      >
        <span className="flex h-8 w-9 flex-col overflow-hidden rounded-sm bg-background shadow-sm ring-1 ring-foreground/10">
          <span className="h-1.5 bg-primary" />
        </span>
        <span className="size-3.5 rounded-full bg-primary" />
      </span>
    </span>
  );
}
