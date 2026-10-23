import type { ConversationState } from "@marshaldesk/shared";

import { Badge } from "@/components/ui/badge";
import { stateLabel } from "@/lib/conversation-copy";

export function StateBadge({ state }: { state: ConversationState }) {
  return (
    <Badge
      variant={state === "waiting" ? "default" : "outline"}
      className={state === "closed" ? "text-muted-foreground" : undefined}
    >
      {stateLabel(state)}
    </Badge>
  );
}
