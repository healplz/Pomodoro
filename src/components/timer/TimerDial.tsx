"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerCountdown } from "./useTimerCountdown";

type Phase = "idle" | "dragging" | "running" | "complete" | "resting";

const FG = "#CAECFC";
const fg = (alpha: number) => `rgba(202,236,252,${alpha})`;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function playBell() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    osc.start();
    osc.stop(ctx.currentTime + 1.8);
  } catch {
    // AudioContext not available
  }
}

// How many track-widths of drag are needed to fill the bar.
// Higher = heavier. Combined with ease-out curve, the last stretch
// requires disproportionate effort.
const RESISTANCE = 1.8;

interface Props {
  maxMinutes?: number;
  taskColor?: string;
  disabled?: boolean;
  waitMinutes?: number;
  strictMode?: boolean;
  onComplete: (durationSeconds: number) => void;
}

export function TimerDial({ maxMinutes = 25, taskColor = "#31C202", disabled = false, waitMinutes = 5, strictMode = false, onComplete }: Props) {
  const [fillPct, setFillPct] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);

  const dragStartX = useRef(0);
  const dragStartFill = useRef(0);
  const totalSecondsRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const wasAtMax = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Break counter
  useEffect(() => {
    if (phase !== "resting") return;
    setBreakSeconds(0);
    const maxBreak = waitMinutes * 60;
    const id = setInterval(() => {
      setBreakSeconds((s) => s >= maxBreak ? s : Math.min(s + 1, maxBreak));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, waitMinutes]);

  const getTrackWidth = useCallback(
    () => trackRef.current?.getBoundingClientRect().width ?? 320,
    []
  );

  // Shared drag logic used by both pointer and touch handlers
  const startDrag = useCallback(
    (clientX: number) => {
      if (phase === "running" || disabled) return;
      if (phase === "resting") {
        const breakDone = breakSeconds >= (waitMinutes ?? 5) * 60;
        if (strictMode && !breakDone) return; // blocked
        setPhase("idle");
        setBreakSeconds(0);
        setFillPct(0);
        return;
      }
      dragStartX.current = clientX;
      dragStartFill.current = fillPct;
      wasAtMax.current = false;
      setPhase("dragging");
    },
    [phase, fillPct, disabled, breakSeconds, waitMinutes, strictMode]
  );

  const moveDrag = useCallback(
    (clientX: number) => {
      if (phase !== "dragging") return;
      const trackW = getTrackWidth();
      const dx = clientX - dragStartX.current;
      // Cap drag distance to 85% of viewport so mobile users can always
      // reach 100% in one swipe. On desktop RESISTANCE still applies.
      const screenAvailable = window.innerWidth - dragStartX.current - 16;
      const maxDrag = Math.min(trackW * RESISTANCE, screenAvailable);
      const rawProgress = Math.max(0, dx) / maxDrag;
      const eased = 1 - Math.pow(1 - Math.min(1, rawProgress), 2);
      const newFill = Math.max(0, eased * 100);
      setFillPct(newFill);

      if (newFill >= 100 && !wasAtMax.current) {
        wasAtMax.current = true;
        if ("vibrate" in navigator) navigator.vibrate(15);
      } else if (newFill < 100) {
        wasAtMax.current = false;
      }
    },
    [phase, getTrackWidth]
  );

  const endDrag = useCallback(() => {
    if (phase !== "dragging") return;
    if (fillPct >= 100) {
      totalSecondsRef.current = maxMinutes * 60;
      setRemainingSeconds(maxMinutes * 60);
      setFillPct(100);
      setPhase("running");
    } else {
      setFillPct(0);
      setPhase("idle");
    }
  }, [phase, fillPct, maxMinutes]);

  // Pointer event handlers (desktop + some mobile)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      startDrag(e.clientX);
    },
    [startDrag]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => { moveDrag(e.clientX); },
    [moveDrag]
  );

  const handlePointerUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Touch event handlers (mobile fallback)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      startDrag(e.touches[0].clientX);
    },
    [startDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      moveDrag(e.touches[0].clientX);
    },
    [moveDrag]
  );

  const handleTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleCancel = useCallback(() => {
    setPhase("idle");
    setFillPct(0);
    setRemainingSeconds(0);
  }, []);

  const handleTick = useCallback((remaining: number) => {
    setRemainingSeconds(remaining);
    if (totalSecondsRef.current > 0) {
      setFillPct((remaining / totalSecondsRef.current) * 100);
    }
  }, []);

  const handleComplete = useCallback(() => {
    playBell();
    setFillPct(0);
    setPhase("complete");
    onComplete(totalSecondsRef.current);
  }, [onComplete]);

  useTimerCountdown(
    phase === "running" ? totalSecondsRef.current : null,
    handleTick,
    handleComplete
  );

  // In strict mode, auto-return to idle when break completes —
  // avoids the tap-then-layout-shift that happens with manual dismissal.
  useEffect(() => {
    if (!strictMode || phase !== "resting") return;
    if (breakSeconds < waitMinutes * 60) return;
    const t = setTimeout(() => {
      setPhase("idle");
      setBreakSeconds(0);
      setFillPct(0);
    }, 800); // brief pause so "Break over" is visible before returning
    return () => clearTimeout(t);
  }, [strictMode, phase, breakSeconds, waitMinutes]);

  useEffect(() => {
    if (phase === "complete") {
      const t = setTimeout(() => {
        setRemainingSeconds(0);
        setPhase("resting");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const isRunning = phase === "running";
  const isComplete = phase === "complete";
  const isDragging = phase === "dragging";
  const isResting = phase === "resting";
  const atMax = fillPct >= 99.5;
  const breakDone = breakSeconds >= (waitMinutes ?? 5) * 60;

  const majorTicks = Array.from(
    { length: Math.floor(maxMinutes / 5) + 1 },
    (_, i) => i * 5
  );

  if (!mounted) {
    return (
      <div className="w-full flex flex-col items-center gap-6 px-4">
        <div
          className="text-6xl font-bold tabular-nums"
          style={{ fontFamily: "Georgia, serif", color: fg(0.2) }}
        >
          0
        </div>
        <div className="w-full h-14 rounded-full" style={{ background: fg(0.08) }} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-5 select-none px-2">
      {/* Readout */}
      <div
        className="w-full rounded-2xl px-6 py-4 text-center min-h-[5.5rem] flex items-center justify-center"
        style={{
          background: "rgba(0,0,0,0.28)",
          boxShadow: "inset 0 1px 0 rgba(202,236,252,0.06)",
        }}
      >
        {isComplete ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="text-5xl">🍅</div>
            <div className="text-sm font-semibold mt-1" style={{ color: FG }}>
              Done!
            </div>
          </motion.div>
        ) : isRunning ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold tabular-nums"
            style={{ fontFamily: "Georgia, serif", color: FG }}
          >
            {formatTime(remainingSeconds)}
          </motion.div>
        ) : isResting ? (
          <motion.div key="resting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: fg(0.5) }}>
              {breakDone ? "Break over" : "Break"}
            </div>
            <div className="text-6xl font-bold tabular-nums"
              style={{ fontFamily: "Georgia, serif", color: breakDone ? fg(0.8) : fg(0.55) }}>
              {formatTime(Math.min(breakSeconds, (waitMinutes ?? 5) * 60))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="setting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div
              className="text-7xl font-bold tabular-nums"
              style={{
                fontFamily: "Georgia, serif",
                color: disabled ? fg(0.2) : atMax ? FG : fg(0.4),
              }}
            >
              {maxMinutes}
            </div>
            <div
              className="text-xs font-semibold tracking-widest uppercase mt-1"
              style={{ color: disabled ? fg(0.3) : atMax ? fg(0.9) : fg(0.4) }}
            >
              {(disabled ? "select a task" : atMax ? "release" : "drag") + " to start"}
            </div>
          </motion.div>
        )}
      </div>

      {/* Tick labels */}
      <div className="w-full relative h-5">
        {majorTicks.map((min) => (
          <div
            key={min}
            className="absolute text-[11px] font-semibold -translate-x-1/2"
            style={{
              left: `${(min / maxMinutes) * 100}%`,
              color: fg(0.7),
            }}
          >
            {min > 0 && min < maxMinutes ? min : ""}
          </div>
        ))}
      </div>

      {/* Drag track */}
      <div
        ref={trackRef}
        className="relative w-full h-14 rounded-full overflow-hidden touch-none"
        style={{
          background: fg(0.08),
          border: `1px solid ${fg(0.12)}`,
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)",
          cursor: isRunning || disabled ? "default" : "ew-resize",
          opacity: disabled ? 0.5 : 1,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Major tick lines */}
        {majorTicks
          .filter((m) => m > 0 && m < maxMinutes)
          .map((min) => (
            <div
              key={min}
              className="absolute top-2 bottom-2 w-px"
              style={{
                left: `${(min / maxMinutes) * 100}%`,
                backgroundColor: fg(0.45),
              }}
            />
          ))}

        {/* Fill bar */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: taskColor }}
          animate={{
            width: `${fillPct}%`,
            opacity: isRunning ? 0.75 : atMax ? 1 : 0.85,
          }}
          transition={
            isRunning
              ? { type: "tween", duration: 1, ease: "linear" }
              : isDragging
              ? { type: "tween", duration: 0.04 }
              : { type: "spring", stiffness: 350, damping: 28 }
          }
        />

        {/* Thumb — visible during idle and dragging */}
        {!isRunning && !isComplete && !isResting && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full"
            style={{
              left: `${Math.min(fillPct, 100)}%`,
              background: FG,
              boxShadow: isDragging
                ? "0 2px 16px rgba(0,0,0,0.5)"
                : "0 2px 8px rgba(0,0,0,0.3)",
            }}
            animate={{
              scale: atMax ? [1, 1.15, 1] : isDragging ? 1.08 : 1,
            }}
            transition={
              atMax
                ? { repeat: Infinity, duration: 0.55, ease: "easeInOut" }
                : { type: "spring", stiffness: 500, damping: 30 }
            }
          >
            <div className="absolute inset-0 flex items-center justify-center gap-[3px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-[2px] h-5 rounded-full"
                  style={{ backgroundColor: taskColor + "99" }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Running overlay */}
        {isRunning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: fg(0.8) }}
            >
              {Math.ceil(remainingSeconds / 60)} min left
            </span>
          </div>
        )}
      </div>

      {/* Minor tick marks */}
      <div className="w-full relative h-2 -mt-3">
        {Array.from({ length: maxMinutes }, (_, i) => i + 1)
          .filter((m) => m % 5 !== 0)
          .map((min) => (
            <div
              key={min}
              className="absolute top-0 w-px h-1.5 -translate-x-1/2"
              style={{
                left: `${(min / maxMinutes) * 100}%`,
                backgroundColor: fg(0.45),
              }}
            />
          ))}
      </div>

      {/* Hint / cancel */}
      <div className="min-h-[2rem] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isRunning ? (
            <motion.button
              key="cancel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{
                color: fg(0.85),
                border: `1px solid ${fg(0.25)}`,
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <span className="text-xs">✕</span> Cancel session
            </motion.button>
          ) : isResting ? (
            <motion.p
              key="resting-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold"
              style={{ color: fg(0.4) }}
            >
              {strictMode && !breakDone
                ? "break in progress..."
                : "drag to start another"}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
