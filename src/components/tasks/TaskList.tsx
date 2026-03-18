"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  onSelect: (task: Task | null) => void;
  onTaskCreated: (task: Task) => void;
  sessions: DotSession[];
}

const fg = (alpha: number) => `rgba(202,236,252,${alpha})`;

export function TaskList({ tasks, selectedId, onSelect, onTaskCreated, sessions }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Group today's sessions by taskId (null = no task)
  const sessionsByTask = sessions.reduce<Record<string, DotSession[]>>((acc, s) => {
    const key = s.taskId ?? "__none__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const hasTasks = tasks.length > 0;

  const rowBase = {
    borderRadius: 12,
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    transition: "background 0.15s",
    border: `1px solid ${fg(0.08)}`,
  };

  return (
    <>
      <div className="w-full flex flex-col gap-1">

        {/* Task rows */}
        {tasks.map((task) => {
          const isSelected = selectedId === task.id;
          const taskSessions = sessionsByTask[task.id] ?? [];

          return (
            <motion.button
              key={task.id}
              onClick={() => onSelect(task)}
              whileTap={{ scale: 0.985 }}
              style={{
                ...rowBase,
                background: isSelected ? `${task.color}22` : fg(0.06),
                borderColor: isSelected ? `${task.color}66` : fg(0.08),
                width: "100%",
                textAlign: "left",
              }}
            >
              {/* Color swatch */}
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.color, boxShadow: `0 0 6px ${task.color}88` }}
              />

              {/* Task name */}
              <span
                className="text-sm font-semibold flex-1 truncate"
                style={{ color: isSelected ? "#CAECFC" : fg(0.8) }}
              >
                {task.name}
              </span>

              {/* Dots for this task */}
              {taskSessions.length > 0 && (
                <DotRow sessions={taskSessions} />
              )}
            </motion.button>
          );
        })}

        {/* Empty state */}
        {!hasTasks && (
          <p className="text-center text-sm py-2" style={{ color: fg(0.4) }}>
            Add a task to get started
          </p>
        )}

        {/* Add task button */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold transition-colors rounded-xl mt-1"
          style={{ color: fg(0.45), borderRadius: 12 }}
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
