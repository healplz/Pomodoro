"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { TimerDial } from "@/components/timer/TimerDial";
import { TaskPicker, type Task } from "@/components/tasks/TaskPicker";
import { DotGrid, type DotSession } from "@/components/dots/DotGrid";
import { StreakBadge } from "@/components/dots/StreakBadge";

interface Props {
  user: { name: string; image: string };
  initialTasks: Task[];
  initialTodaySessions: DotSession[];
  initialStreak: number;
}

export function Dashboard({
  user,
  initialTasks,
  initialTodaySessions,
  initialStreak,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [todaySessions, setTodaySessions] =
    useState<DotSession[]>(initialTodaySessions);
  const [streak, setStreak] = useState(initialStreak);

  async function handleSessionComplete(durationSeconds: number) {
    const completionDate = new Date().toLocaleDateString("en-CA");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask?.id ?? null,
          durationSeconds,
          completionDate,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setTodaySessions(data.todaySessions);
      setStreak(data.streak);
    } catch {
      // Silently fail — the user still completed the session visually
    }
  }

  const initial = user.name?.[0]?.toUpperCase() ?? "?";

  return (
    <main
      className="min-h-screen flex flex-col items-center"
      style={{ background: "linear-gradient(160deg, #C30232 0%, #8a0122 100%)" }}
    >
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍅</span>
          <span className="text-fg font-bold tracking-wide">Pomodoro</span>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge streak={streak} />
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={32}
              height={32}
              className="rounded-full border-2 border-fg/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-fg/20 flex items-center justify-center text-fg text-sm font-bold">
              {initial}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="text-fg/60 hover:text-fg text-xs font-semibold transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 px-6 pt-4 pb-12 w-full max-w-2xl">
        {/* Task picker */}
        <TaskPicker
          tasks={tasks}
          selectedId={selectedTask?.id ?? null}
          onSelect={setSelectedTask}
          onTaskCreated={(task) => setTasks((prev) => [...prev, task])}
        />

        {/* Timer + dots — framed in a contrast card */}
        <div
          className="w-full rounded-3xl px-5 py-6 flex flex-col gap-6"
          style={{
            background: "rgba(0,0,0,0.22)",
            boxShadow: "inset 0 1px 0 rgba(202,236,252,0.07), 0 4px 24px rgba(0,0,0,0.2)",
          }}
        >
          <TimerDial
            taskColor={selectedTask?.color ?? "#31C202"}
            onComplete={handleSessionComplete}
          />
          <DotGrid sessions={todaySessions} />
        </div>
      </div>
    </main>
  );
}
