"use client";

import { motion } from "framer-motion";

interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  if (streak === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 bg-fg/10 rounded-full px-3 py-1.5"
    >
      <span className="text-base">🔥</span>
      <span className="text-sm font-bold text-fg">
        {streak} day{streak === 1 ? "" : "s"}
      </span>
    </motion.div>
  );
}
