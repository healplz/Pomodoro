import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { pomodoroSessions, tasks } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { computeStreak } from "@/lib/streak";
import { Dashboard } from "@/components/Dashboard";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const today = new Date().toLocaleDateString("en-CA");

  // Fetch user's active tasks
  const userTasks = await getDb()
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId));

  // Fetch all sessions (for streak and today's dots)
  const allSessions = await getDb()
    .select({
      id: pomodoroSessions.id,
      durationSeconds: pomodoroSessions.durationSeconds,
      completionDate: pomodoroSessions.completionDate,
      taskColor: tasks.color,
    })
    .from(pomodoroSessions)
    .leftJoin(tasks, eq(pomodoroSessions.taskId, tasks.id))
    .where(eq(pomodoroSessions.userId, userId))
    .orderBy(desc(pomodoroSessions.completedAt));

  const todaySessions = allSessions
    .filter((s) => s.completionDate === today)
    .map((s) => ({
      id: s.id,
      color: s.taskColor ?? "#E63946",
      durationSeconds: s.durationSeconds,
    }));

  const uniqueDates = [
    ...new Set(allSessions.map((s) => s.completionDate)),
  ].sort((a, b) => b.localeCompare(a));

  return (
    <Dashboard
      user={{
        name: session.user.name ?? "",
        image: session.user.image ?? "",
      }}
      initialTasks={userTasks
        .filter((t) => !t.archivedAt)
        .map((t) => ({ id: t.id, name: t.name, color: t.color }))}
      initialTodaySessions={todaySessions}
      initialStreak={computeStreak(uniqueDates)}
    />
  );
}
