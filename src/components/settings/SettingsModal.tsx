"use client";

import { motion, AnimatePresence } from "framer-motion";

const PRESETS = [5, 10, 15, 20, 25, 30, 45, 60];
const fg = (alpha: number) => `rgba(202,236,252,${alpha})`;

interface Props {
  open: boolean;
  currentMinutes: number;
  currentWaitMinutes: number;
  currentStrict: boolean;
  onClose: () => void;
  onSave: (minutes: number) => void;
  onSaveWait: (minutes: number) => void;
  onSaveStrict: (strict: boolean) => void;
}

export function SettingsModal({ open, currentMinutes, currentWaitMinutes, currentStrict, onClose, onSave, onSaveWait, onSaveStrict }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed z-50 left-1/2 top-1/2 w-80 rounded-2xl p-6"
            style={{
              background: "linear-gradient(160deg, #9a021e 0%, #6a0118 100%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(202,236,252,0.1)",
              border: `1px solid ${fg(0.15)}`,
            }}
            initial={{ opacity: 0, scale: 0.92, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.92, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-fg font-bold text-lg tracking-wide">Pomo duration</h2>
              <button
                onClick={onClose}
                className="text-fg/50 hover:text-fg transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((min) => {
                const isSelected = min === currentMinutes;
                return (
                  <button
                    key={min}
                    onClick={() => onSave(min)}
                    className="py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: isSelected ? fg(0.25) : fg(0.08),
                      color: isSelected ? "#CAECFC" : fg(0.6),
                      border: `1px solid ${isSelected ? fg(0.4) : fg(0.1)}`,
                    }}
                  >
                    {min}m
                  </button>
                );
              })}
            </div>

            <p className="text-center mt-4 text-xs font-semibold" style={{ color: fg(0.35) }}>
              Current: {currentMinutes} min
            </p>

            <div className="mt-5">
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: fg(0.5) }}>
                Break duration
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((min) => {
                  const isSelected = min === currentWaitMinutes;
                  return (
                    <button
                      key={min}
                      onClick={() => onSaveWait(min)}
                      className="py-3 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: isSelected ? fg(0.25) : fg(0.08),
                        color: isSelected ? "#CAECFC" : fg(0.6),
                        border: `1px solid ${isSelected ? fg(0.4) : fg(0.1)}`,
                      }}
                    >
                      {min}m
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: fg(0.85) }}>Strict breaks</p>
                <p className="text-xs mt-0.5" style={{ color: fg(0.4) }}>
                  Can&apos;t start until break ends
                </p>
              </div>
              <button
                onClick={() => onSaveStrict(!currentStrict)}
                className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
                style={{
                  background: currentStrict ? "#31C202" : fg(0.15),
                }}
              >
                <motion.span
                  className="absolute top-0.5 w-5 h-5 rounded-full"
                  style={{ background: "#CAECFC" }}
                  animate={{ left: currentStrict ? "calc(100% - 22px)" : "2px" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
