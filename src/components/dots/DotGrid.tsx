"use client";

import { motion, AnimatePresence } from "framer-motion";

export interface DotSession {
  id: string;
  color: string; // task color or default
  durationSeconds: number;
}

interface Props {
  sessions: DotSession[];
}

export function DotGrid({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-fg/55 text-sm font-semibold text-center">
        Complete a session to earn your first dot
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold text-fg/70 uppercase tracking-widest">Today</p>
      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        <AnimatePresence>
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 28,
                delay: i * 0.03,
              }}
              title={`${Math.round(s.durationSeconds / 60)} min session`}
            >
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  backgroundColor: s.color,
                  boxShadow: `0 0 8px ${s.color}88`,
                }}
              />
            </motion.div>
          ))}

          {/* Milestone: every 4 dots gets a tomato emoji marker */}
          {sessions.length > 0 && sessions.length % 4 === 0 && (
            <motion.div
              key="milestone"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-base leading-none"
              title="4 pomodoros! Great focus!"
            >
              🍅
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
