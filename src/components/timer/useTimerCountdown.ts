import { useEffect, useRef } from "react";

/**
 * Runs a countdown from totalSeconds to 0.
 * Pass null to stop/reset.
 * onTick fires every second with remaining seconds.
 * onComplete fires when remaining hits 0.
 */
export function useTimerCountdown(
  totalSeconds: number | null,
  onTick: (remaining: number) => void,
  onComplete: () => void
) {
  const remainingRef = useRef(0);
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);

  // Keep refs current without restarting the effect
  onTickRef.current = onTick;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (totalSeconds === null) return;

    remainingRef.current = totalSeconds;

    const interval = setInterval(() => {
      remainingRef.current -= 1;
      onTickRef.current(remainingRef.current);

      if (remainingRef.current <= 0) {
        clearInterval(interval);
        onCompleteRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds]);
}
