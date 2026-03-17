"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerCountdown } from "./useTimerCountdown";

const MAX_MINUTES = 60;

type Phase = "idle" | "dragging" | "running" | "complete";

// #CAECFC at various opacities for inline styles
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

interface Props {
  taskColor?: string;
  onComplete: (durationSeconds: number) => void;
}

export function TimerDial({ taskColor = "#31C202", onComplete }: Props) {
  const [minutes, setMinutes] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);

  const dragStartX = useRef(0);
  const dragStartMinutes = useRef(0);
  const totalSecondsRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const getTrackWidth = useCallback(() => {
    return trackRef.current?.getBoundingClientRect().width ?? 320;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (phase === "running") return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartX.current = e.clientX;
      dragStartMinutes.current = minutes;
      setPhase("dragging");
    },
    [phase, minutes]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== "dragging") return;

      const trackW = getTrackWidth();
      const dx = e.clientX - dragStartX.current;
      const deltaMinutes = (dx / trackW) * MAX_MINUTES;
      const newMinutes = Math.max(
        0,
        Math.min(MAX_MINUTES, dragStartMinutes.current + deltaMinutes)
      );
      const rounded = Math.round(newMinutes);

      if (rounded !== minutes) {
        setMinutes(rounded);
        if ("vibrate" in navigator) navigator.vibrate(8);
      }
    },
    [phase, minutes, getTrackWidth]
  );

  const handlePointerUp = useCallback(() => {
    if (phase !== "dragging") return;
    if (minutes > 0) {
      totalSecondsRef.current = minutes * 60;
      setRemainingSeconds(minutes * 60);
      setPhase("running");
    } else {
      setPhase("idle");
    }
  }, [phase, minutes]);

  const handleCancel = useCallback(() => {
    setPhase("idle");
    setMinutes(0);
    setRemainingSeconds(0);
  }, []);

  const handleTick = useCallback((remaining: number) => {
    setRemainingSeconds(remaining);
  }, []);

  const handleComplete = useCallback(() => {
    setPhase("complete");
    playBell();
    onComplete(totalSecondsRef.current);
  }, [onComplete]);

  useTimerCountdown(
    phase === "running" ? totalSecondsRef.current : null,
    handleTick,
    handleComplete
  );

  useEffect(() => {
    if (phase === "complete") {
      const t = setTimeout(() => {
        setMinutes(0);
        setRemainingSeconds(0);
        setPhase("idle");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const isRunning = phase === "running";
  const isComplete = phase === "complete";
  const isDragging = phase === "dragging";

  const settingFillPct = (minutes / MAX_MINUTES) * 100;
  const runningFillPct =
    totalSecondsRef.current > 0
      ? (remainingSeconds / totalSecondsRef.current) * settingFillPct
      : 0;
  const activeFillPct = isRunning ? runningFillPct : settingFillPct;

  const majorTicks = Array.from({ length: MAX_MINUTES / 5 + 1 }, (_, i) => i * 5);

  if (!mounted) {
    return (
      <div className="w-full flex flex-col items-center gap-6 px-4">
        <div className="text-6xl font-bold tabular-nums text-fg/20" style={{ fontFamily: "Georgia, serif" }}>
          0
        </div>
        <div className="w-full h-14 rounded-full" style={{ background: fg(0.08) }} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-5 select-none px-2">

      {/* Large time readout — framed in a dark card for contrast */}
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
            <div className="text-sm font-semibold mt-1" style={{ color: FG }}>Done!</div>
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
                color: minutes > 0 ? FG : fg(0.35),
              }}
            >
              {minutes}
            </div>
            <div
              className="text-xs font-semibold tracking-widest uppercase mt-1"
              style={{ color: minutes > 0 ? fg(0.75) : fg(0.45) }}
            >
              {minutes === 0 ? "drag to set" : minutes === 1 ? "minute" : "minutes"}
            </div>
          </motion.div>
        )}
      </div>

      {/* Tick mark labels */}
      <div className="w-full relative h-5">
        {majorTicks.map((min) => (
          <div
            key={min}
            className="absolute text-[11px] font-semibold -translate-x-1/2"
            style={{ left: `${(min / MAX_MINUTES) * 100}%`, color: fg(0.65) }}
          >
            {min > 0 && min < 60 ? min : ""}
          </div>
        ))}
      </div>

      {/* The drag track */}
      <div
        ref={trackRef}
        className="relative w-full h-14 rounded-full overflow-hidden touch-none"
        style={{
          background: fg(0.08),
          border: `1px solid ${fg(0.12)}`,
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)",
          cursor: isRunning ? "default" : "ew-resize",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Major tick lines inside track */}
        {majorTicks.filter(m => m > 0 && m < MAX_MINUTES).map((min) => (
          <div
            key={min}
            className="absolute top-2 bottom-2 w-px"
            style={{ left: `${(min / MAX_MINUTES) * 100}%`, backgroundColor: fg(0.1) }}
          />
        ))}

        {/* Fill bar */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: taskColor }}
          animate={{ width: `${activeFillPct}%`, opacity: isRunning ? 0.75 : 0.9 }}
          transition={
            isRunning
              ? { type: "tween", duration: 1, ease: "linear" }
              : { type: "spring", stiffness: 400, damping: 30 }
          }
        />

        {/* Thumb */}
        {!isRunning && !isComplete && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full"
            style={{
              left: `${settingFillPct}%`,
              background: FG,
              boxShadow: isDragging
                ? "0 2px 12px rgba(0,0,0,0.4)"
                : "0 2px 8px rgba(0,0,0,0.3)",
            }}
            animate={{ scale: isDragging ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {/* Grip ridges */}
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

        {/* Running: time remaining overlay */}
        {isRunning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-bold tracking-wide" style={{ color: fg(0.8) }}>
              {Math.ceil(remainingSeconds / 60)} min left
            </span>
          </div>
        )}
      </div>

      {/* Minor tick marks below track */}
      <div className="w-full relative h-2 -mt-3">
        {Array.from({ length: MAX_MINUTES }, (_, i) => i + 1)
          .filter(m => m % 5 !== 0)
          .map((min) => (
            <div
              key={min}
              className="absolute top-0 w-px h-1.5 -translate-x-1/2"
              style={{ left: `${(min / MAX_MINUTES) * 100}%`, backgroundColor: fg(0.15) }}
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                color: fg(0.85),
                border: `1px solid ${fg(0.25)}`,
                background: "rgba(0,0,0,0.2)",
              }}
              whileHover={{ color: FG }}
            >
              <span className="text-xs">✕</span> Cancel session
            </motion.button>
          ) : minutes > 0 && !isComplete ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold"
              style={{ color: fg(0.65) }}
            >
              Release to start
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
