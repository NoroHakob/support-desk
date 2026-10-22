import { cn } from "cn";

import { trust } from "@/components/landing/content";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function TrustRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center [--trust-size:clamp(36px,4.5vw,42px)] max-xs:[--trust-size:34px]",
        className,
      )}
    >
      <AvatarGroup
        aria-hidden="true"
        className="-space-x-[calc(var(--trust-size)*0.42)] *:data-[slot=avatar]:ring-0"
      >
        {trust.icons.map(({ label, icon: Icon }) => (
          <Avatar
            key={label}
            className="relative z-10 size-(--trust-size) border border-ink-line bg-ink p-[5px] shadow-soft after:hidden"
          >
            <AvatarFallback className="bg-white text-black">
              <Icon className="size-[48%]" strokeWidth={2.25} />
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <Badge
        variant="ink"
        className="relative z-0 -ml-[calc(var(--trust-size)*0.42)] h-[calc(var(--trust-size)-6px)] pr-3.5 pl-[calc(var(--trust-size)*0.42+12px)] text-[clamp(12px,1.4vw,13.5px)] text-ink-muted max-xs:text-xs"
      >
        {trust.label}
      </Badge>
    </div>
  );
}
