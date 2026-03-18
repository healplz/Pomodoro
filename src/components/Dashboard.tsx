"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { TimerDial } from "@/components/timer/TimerDial";
import { TaskList, type Task } from "@/components/tasks/TaskList";
import { StreakBadge } from "@/components/dots/StreakBadge";
import { SettingsModal } from "@/components/settings/SettingsModal";
import type { DotSession } from "@/components/dots/DotGrid";

interface Props {
  user: { name: string; image: string };
  initialTasks: Task[];
  initialTodaySessions: DotSession[];
  initialStreak: number;
  initialMaxMinutes: number;
  initialWaitMinutes: number;
  initialStrictWait: boolean;
}

export function Dashboard({
  user,
  initialTasks,
  initialTodaySessions,
  initialStreak,
  initialMaxMinutes,
  initialWaitMinutes,
  initialStrictWait,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(
    initialTasks[0] ?? null
  );
  const [todaySessions, setTodaySessions] = useState<DotSession[]>(initialTodaySessions);
  const [streak, setStreak] = useState(initialStreak);
  const [pomoDurationMinutes, setPomoDurationMinutes] = useState(initialMaxMinutes);
  const [waitMinutes, setWaitMinutes] = useState(initialWaitMinutes);
  const [strictMode, setStrictMode] = useState(initialStrictWait);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      // Silently fail — user still completed the session visually
    }
  }

  async function handleSaveSettings(minutes: number) {
    setPomoDurationMinutes(minutes);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pomoDurationMinutes: minutes }),
      });
    } catch {
      // Silently fail
    }
  }

  async function handleSaveWait(minutes: number) {
    setWaitMinutes(minutes);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitDurationMinutes: minutes }),
      });
    } catch {
      // Silently fail
    }
  }

  async function handleSaveStrict(strict: boolean) {
    setStrictMode(strict);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strictWait: strict }),
      });
    } catch {
      // Silently fail
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
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-fg/60 hover:text-fg transition-colors"
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
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
      <div className="flex flex-col items-center gap-6 px-6 pt-4 pb-12 w-full max-w-2xl">

        {/* Timer */}
        <div
          className="w-full rounded-3xl px-5 py-6"
          style={{
            background: "rgba(0,0,0,0.22)",
            boxShadow: "inset 0 1px 0 rgba(202,236,252,0.07), 0 4px 24px rgba(0,0,0,0.2)",
          }}
        >
          <TimerDial
            maxMinutes={pomoDurationMinutes}
            taskColor={selectedTask?.color ?? "#31C202"}
            disabled={!selectedTask}
            waitMinutes={waitMinutes}
            strictMode={strictMode}
            onComplete={handleSessionComplete}
          />
        </div>

        {/* Task list with inline dots */}
        <div
          className="w-full rounded-3xl px-5 py-4"
          style={{
            background: "rgba(0,0,0,0.22)",
            boxShadow: "inset 0 1px 0 rgba(202,236,252,0.07), 0 4px 24px rgba(0,0,0,0.2)",
          }}
        >
          <p className="text-xs font-bold text-fg/50 uppercase tracking-widest mb-3">Tasks</p>
          <TaskList
            tasks={tasks}
            selectedId={selectedTask?.id ?? null}
            onSelect={setSelectedTask}
            onTaskCreated={(task) => setTasks((prev) => [...prev, task])}
            sessions={todaySessions}
          />
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        currentMinutes={pomoDurationMinutes}
        currentWaitMinutes={waitMinutes}
        currentStrict={strictMode}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
        onSaveWait={handleSaveWait}
        onSaveStrict={handleSaveStrict}
      />
    </main>
  );
}
