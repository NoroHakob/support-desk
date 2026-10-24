"use client";

import { MessagesSquare, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ConversationList,
  inboxFilters,
  type InboxFilter,
} from "@/components/inbox/conversation-list";
import { ConversationView } from "@/components/inbox/conversation-view";
import { useInbox } from "@/components/inbox/use-inbox";
import { VisitorDetails } from "@/components/inbox/visitor-details";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useDocumentVisible } from "@/hooks/use-document-visible";
import { useElementWidth } from "@/hooks/use-element-width";
import { visitorAvatarUri } from "@/lib/avatar";

// Below this width the three panels can't keep their minimum sizes
// (260 + 340 + 220 px plus the gaps), so the details move into a sheet.
const DETAILS_PANEL_MIN_WIDTH = 880;

function parseFilter(value: string | null): InboxFilter {
  return inboxFilters.find((filter) => filter === value) ?? "all";
}

// Filter and selection live in the URL. Updating it through the History API
// keeps the page from re-rendering on the server; the queries do the loading.
function setParams(change: Record<string, string | null>, push: boolean) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(change)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  const url = query ? `?${query}` : window.location.pathname;
  if (push) window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {children}
    </div>
  );
}

export function Inbox() {
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("state"));
  const openId = searchParams.get("c");
  const { conversations, open, openLoading, actions, markRead, busy, error } =
    useInbox(openId);
  const avatars = useMemo(
    () =>
      Object.fromEntries(
        [
          ...conversations.map(({ visitor }) => visitor),
          ...(open ? [open.visitor] : []),
        ].map((visitor) => [visitor.id, visitorAvatarUri(visitor.id)]),
      ),
    [conversations, open],
  );

  // A conversation counts as read only once the owner can see it, so the tab
  // badge stays while they're elsewhere (PRD D-6).
  const visible = useDocumentVisible();
  const openUnreadId = open?.unread ? open.id : null;
  useEffect(() => {
    if (openUnreadId && visible) markRead(openUnreadId);
  }, [openUnreadId, visible, markRead]);
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const showDetailsPanel = width === null || width >= DETAILS_PANEL_MIN_WIDTH;
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

  return (
    <div ref={containerRef} className="flex min-w-0 flex-1 overflow-hidden">
      <ResizablePanelGroup
        key={showDetailsPanel ? "with-details" : "without-details"}
        orientation="horizontal"
        className="min-h-0 min-w-0"
      >
        <ResizablePanel
          id="list"
          defaultSize={showDetailsPanel ? "30%" : "38%"}
          minSize={260}
          className="p-px"
        >
          <Card>
            <ConversationList
              conversations={conversations}
              filter={filter}
              selectedId={openId}
              avatars={avatars}
              onFilterChange={(next) =>
                setParams({ state: next === "all" ? null : next }, false)
              }
              onSelect={(id) => setParams({ c: id }, true)}
            />
          </Card>
        </ResizablePanel>
        <InboxHandle />
        <ResizablePanel id="conversation" minSize={340} className="p-px">
          <Card>
            {open ? (
              <ConversationView
                key={open.id}
                conversation={open}
                avatarUrl={avatars[open.visitor.id]}
                actions={actions}
                busy={busy}
                error={error}
                onOpenDetails={
                  showDetailsPanel ? undefined : () => setDetailsSheetOpen(true)
                }
              />
            ) : openLoading ? null : (
              <Empty className="flex-1">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessagesSquare />
                  </EmptyMedia>
                  <EmptyTitle>No conversation open</EmptyTitle>
                  <EmptyDescription>
                    Pick one from the list to read it and reply.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </ResizablePanel>
        {showDetailsPanel ? (
          <>
            <InboxHandle />
            <ResizablePanel
              id="details"
              defaultSize="26%"
              minSize={220}
              maxSize="34%"
              className="p-px"
            >
              <Card>
                {open ? (
                  <VisitorDetails
                    visitor={open.visitor}
                    avatarUrl={avatars[open.visitor.id]}
                  />
                ) : (
                  <Empty className="flex-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserRound />
                      </EmptyMedia>
                      <EmptyDescription>
                        Visitor details show up here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </Card>
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>

      <Sheet
        open={detailsSheetOpen && !showDetailsPanel && !!open}
        onOpenChange={setDetailsSheetOpen}
      >
        <SheetContent side="right" className="w-80 gap-0 p-0 sm:max-w-80">
          <SheetTitle className="sr-only">Visitor details</SheetTitle>
          {open ? (
            <VisitorDetails
              visitor={open.visitor}
              avatarUrl={avatars[open.visitor.id]}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InboxHandle() {
  return (
    <ResizableHandle
      withHandle
      className="w-3 bg-transparent after:w-3 [&>div]:bg-transparent [&>div]:transition-colors hover:[&>div]:bg-foreground/25 data-[separator=active]:[&>div]:bg-foreground/40"
    />
  );
}
