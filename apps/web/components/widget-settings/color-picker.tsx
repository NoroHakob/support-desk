"use client";

import {
  widgetColorHex,
  widgetColorSchema,
  type WidgetColor,
} from "@marshaldesk/shared";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const labels: Record<WidgetColor, string> = {
  blue: "Blue",
  indigo: "Indigo",
  violet: "Violet",
  pink: "Pink",
  red: "Red",
  orange: "Orange",
  green: "Green",
};

export function ColorPicker({
  value,
  onChange,
}: {
  value: WidgetColor;
  onChange: (value: WidgetColor) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <RadioGroup
        aria-label="Accent color"
        value={value}
        onValueChange={(next) => onChange(widgetColorSchema.parse(next))}
        className="flex w-auto flex-wrap gap-2.5"
      >
        {widgetColorSchema.options.map((color) => (
          <RadioGroupItem
            key={color}
            value={color}
            aria-label={labels[color]}
            style={{ backgroundColor: widgetColorHex[color] }}
            className="size-7 border-0 ring-offset-2 ring-offset-card after:-inset-1 dark:bg-transparent data-checked:ring-2 data-checked:ring-foreground/70 [&_[data-slot=radio-group-indicator]]:size-7 [&_[data-slot=radio-group-indicator]>span]:size-2.5 [&_[data-slot=radio-group-indicator]>span]:bg-white"
          />
        ))}
      </RadioGroup>
      <span className="text-sm text-muted-foreground">{labels[value]}</span>
    </div>
  );
}
