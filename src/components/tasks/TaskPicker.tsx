"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreateTaskModal } from "./CreateTaskModal";

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
}

// #CAECFC helpers
const fg = (alpha: number) => `rgba(202,236,252,${alpha})`;

export function TaskPicker({ tasks, selectedId, onSelect, onTaskCreated }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-sm w-full">
        {/* No task chip */}
        <button
          onClick={() => onSelect(null)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            background: selectedId === null ? fg(0.22) : fg(0.1),
            color: selectedId === null ? "#CAECFC" : fg(0.7),
            border: `1px solid ${fg(0.15)}`,
          }}
        >
          No task
        </button>

        {/* Task chips */}
        {tasks.map((task) => (
          <motion.button
            key={task.id}
            onClick={() => onSelect(task)}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: selectedId === task.id ? `${task.color}44` : fg(0.1),
              color: selectedId === task.id ? "#CAECFC" : fg(0.7),
              border: `1px solid ${selectedId === task.id ? task.color + "99" : fg(0.15)}`,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.color }}
            />
            {task.name}
          </motion.button>
        ))}

        {/* Add new task */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all text-lg leading-none"
          style={{
            color: fg(0.4),
            border: `1px dashed ${fg(0.2)}`,
          }}
          title="New task"
        >
          +
        </button>
      </div>

      <CreateTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(task) => {
          onTaskCreated(task);
          onSelect(task);
        }}
      />
    </>
  );
}
