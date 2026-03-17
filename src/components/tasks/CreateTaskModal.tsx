"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ColorPicker } from "@/components/ui/ColorPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (task: { id: string; name: string; color: string }) => void;
}

const fg = (alpha: number) => `rgba(202,236,252,${alpha})`;

export function CreateTaskModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#31C202");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) throw new Error(await res.text());
      const task = await res.json();
      onCreated(task);
      setName("");
      setColor("#31C202");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div
              className="rounded-2xl p-6 shadow-2xl"
              style={{
                background: "#1a0008",
                border: `1px solid ${fg(0.1)}`,
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#CAECFC" }}>
                New Task
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: fg(0.85) }}>
                    Task name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deep work, Reading..."
                    className="w-full rounded-lg px-3 py-2.5 focus:outline-none transition-colors"
                    style={{
                      background: fg(0.05),
                      border: `1px solid ${fg(0.1)}`,
                      color: "#CAECFC",
                    }}
                    autoFocus
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: fg(0.85) }}>
                    Color
                  </label>
                  <ColorPicker value={color} onChange={setColor} />
                </div>

                {/* Preview */}
                <div className="flex items-center gap-2 py-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-semibold truncate" style={{ color: fg(0.85) }}>
                    {name || "Unnamed task"}
                  </span>
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-lg text-sm transition-colors"
                    style={{
                      border: `1px solid ${fg(0.1)}`,
                      color: fg(0.6),
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: color, color: "#CAECFC" }}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
