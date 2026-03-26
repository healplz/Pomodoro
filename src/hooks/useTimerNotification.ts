import { useRef, useCallback } from "react";

export function useTimerNotification() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  // Schedule an OS notification to fire after `seconds`.
  // Called when a session starts so it fires even if the tab is backgrounded.
  const schedule = useCallback((seconds: number, taskName?: string) => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      new Notification("🍅 Pomodoro complete!", {
        body: taskName ? `Nice work on "${taskName}"` : "Time for a break",
        icon: "/icon.svg",
      });
    }, seconds * 1000);
  }, []);

  // Cancel a pending notification (on cancel or in-focus completion).
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { requestPermission, schedule, cancel };
}
