import { cn } from "cn";
import { UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function VisitorAvatar({
  src,
  className,
}: {
  src: string | undefined;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-10", className)}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>
        <UserRound className="size-1/2" />
      </AvatarFallback>
    </Avatar>
  );
}
