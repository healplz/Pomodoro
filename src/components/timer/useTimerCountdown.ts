import { useEffect, useRef } from "react";

/**
 * Runs a countdown from totalSeconds to 0.
 * Pass null to stop/reset.
 * onTick fires every second with remaining seconds.
 * onComplete fires when remaining hits 0.
 *
 * Anchored to Date.now() so the countdown stays accurate if the browser
 * throttles setInterval (backgrounded tabs, mobile, etc.). A
 * visibilitychange listener forces an immediate resync when the tab
 * regains focus so the display never shows stale time.
 */
export function useTimerCountdown(
  totalSeconds: number | null,
  onTick: (remaining: number) => void,
  onComplete: () => void
) {
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);

  onTickRef.current = onTick;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (totalSeconds === null) return;

    const startedAt = Date.now();
    let completed = false;
    let id: ReturnType<typeof setInterval>;

    function tick() {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, totalSeconds! - elapsed);
      onTickRef.current(remaining);
      if (remaining <= 0 && !completed) {
        completed = true;
        clearInterval(id);
        onCompleteRef.current();
      }
    }

    tick(); // immediate tick so display updates instantly on start
    id = setInterval(tick, 1000);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") tick();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [totalSeconds]);
}
