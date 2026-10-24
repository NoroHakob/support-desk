"use client";

import { BellRing } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { IconButton } from "@/components/dashboard/icon-button";
import { unlockNotificationSound } from "@/lib/notification-sound";

function subscribe() {
  return () => undefined;
}

/**
 * Browsers only show the permission prompt after a click, so the owner turns
 * notifications on here. Hidden once they've answered.
 */
export function NotificationsButton() {
  const supported = useSyncExternalStore(
    subscribe,
    () => "Notification" in window,
    () => false,
  );
  const [answered, setAnswered] = useState(false);

  if (!supported || answered || Notification.permission !== "default") {
    return null;
  }

  return (
    <IconButton
      label="Turn on notifications"
      onClick={() => {
        unlockNotificationSound();
        void Notification.requestPermission().then(() => setAnswered(true));
      }}
    >
      <BellRing />
    </IconButton>
  );
}
