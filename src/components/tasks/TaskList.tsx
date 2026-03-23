"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateTaskModal } from "./CreateTaskModal";
import { DotRow, type DotSession } from "@/components/dots/DotGrid";

export interface Task {
  id: string;
  name: string;
  color: string;
}

interface Props {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (task: Task) => void;
  onTaskCreated: (task: Task) => void;
  onTaskDeleted: (id: string) => void;
  sessions: DotSession[];
}

const fg = (alpha: number) => `rgba(202,236,252,${alpha})`;

export function TaskList({ tasks, selectedId, onSelect, onTaskCreated, onTaskDeleted, sessions }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sessionsByTask = sessions.reduce<Record<string, DotSession[]>>((acc, s) => {
    const key = s.taskId ?? "__none__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      onTaskDeleted(id);
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <>
      <div className="w-full flex flex-col gap-1">
        {tasks.map((task) => {
          const isSelected = selectedId === task.id;
          const isConfirming = confirmingId === task.id;
          const isDeleting = deletingId === task.id;
          const taskSessions = sessionsByTask[task.id] ?? [];

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2 rounded-xl px-3.5"
              style={{
                background: isSelected ? `${task.color}22` : fg(0.06),
                border: `1px solid ${isSelected ? task.color + "66" : fg(0.08)}`,
                minHeight: 44,
              }}
            >
              {isConfirming ? (
                /* Inline delete confirmation */
                <div className="flex items-center gap-2 flex-1 py-2">
                  <span className="text-sm font-semibold flex-1 truncate" style={{ color: fg(0.7) }}>
                    Delete &ldquo;{task.name}&rdquo;?
                  </span>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={isDeleting}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-opacity"
                    style={{ background: "#c30232", color: "#CAECFC", opacity: isDeleting ? 0.5 : 1 }}
                  >
                    {isDeleting ? "…" : "Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ background: fg(0.1), color: fg(0.7) }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Normal row */
                <>
                  <button
                    onClick={() => onSelect(task)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 py-2 text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.color, boxShadow: `0 0 6px ${task.color}88` }}
                    />
                    <span
                      className="text-sm font-semibold flex-1 truncate"
                      style={{ color: isSelected ? "#CAECFC" : fg(0.8) }}
                    >
                      {task.name}
                    </span>
                    {taskSessions.length > 0 && <DotRow sessions={taskSessions} />}
                  </button>

                  <button
                    onClick={() => setConfirmingId(task.id)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                    style={{ color: fg(0.3) }}
                    title="Delete task"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1H11zm1.958 1l-.846 10.58a1 1 0 0 1-.997.92H4.885a1 1 0 0 1-.997-.92L3.042 3.5h9.916z"/>
                    </svg>
                  </button>
                </>
              )}
            </motion.div>
          );
        })}

        <AnimatePresence />

        {tasks.length === 0 && (
          <p className="text-center text-sm py-2" style={{ color: fg(0.4) }}>
            Add a task to get started
          </p>
        )}

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold transition-colors rounded-xl mt-1"
          style={{ color: fg(0.45) }}
        >
          <span className="text-base leading-none" style={{ color: fg(0.35) }}>+</span>
          New task
        </button>
      </div>

      <CreateTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(task) => {
          onTaskCreated(task);
          onSelect(task);
          setModalOpen(false);
        }}
      />
    </>
  );
}
