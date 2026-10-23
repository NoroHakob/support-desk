import { cn } from "cn";
import { ChevronDown, MessageCircle } from "lucide-react";

export function WidgetLauncher({
  accentHex,
  open,
  className,
}: {
  accentHex: string;
  open: boolean;
  className?: string;
}) {
  const Icon = open ? ChevronDown : MessageCircle;
  return (
    <span
      style={{ backgroundColor: accentHex }}
      className={cn(
        "flex size-12 items-center justify-center rounded-full text-white shadow-soft",
        className,
      )}
    >
      <Icon className="size-6" />
    </span>
  );
}
