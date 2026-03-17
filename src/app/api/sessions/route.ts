import { auth } from "@/auth";
import { db } from "@/db";
import { pomodoroSessions, tasks } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { computeStreak } from "@/lib/streak";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "today";

  // Get today's date from query param (client's local date)
  const today = searchParams.get("today") ?? new Date().toLocaleDateString("en-CA");

  // Fetch sessions with task info
  const rows = await db
    .select({
      id: pomodoroSessions.id,
      durationSeconds: pomodoroSessions.durationSeconds,
      completionDate: pomodoroSessions.completionDate,
      completedAt: pomodoroSessions.completedAt,
      taskId: pomodoroSessions.taskId,
      taskColor: tasks.color,
      taskName: tasks.name,
    })
    .from(pomodoroSessions)
    .leftJoin(tasks, eq(pomodoroSessions.taskId, tasks.id))
    .where(eq(pomodoroSessions.userId, session.user.id))
    .orderBy(desc(pomodoroSessions.completedAt));

  const todaySessions = rows
    .filter((r) => r.completionDate === today)
    .map((r) => ({
      id: r.id,
      color: r.taskColor ?? "#E63946",
      durationSeconds: r.durationSeconds,
    }));

  // Unique dates descending for streak computation
  const uniqueDates = [...new Set(rows.map((r) => r.completionDate))].sort(
    (a, b) => b.localeCompare(a)
  );
  const streak = computeStreak(uniqueDates);

  return NextResponse.json({ todaySessions, streak, total: rows.length });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const durationSeconds = Number(body.durationSeconds);
  const completionDate =
    typeof body.completionDate === "string"
      ? body.completionDate
      : new Date().toLocaleDateString("en-CA");
  const taskId =
    typeof body.taskId === "string" && body.taskId ? body.taskId : null;

  if (!durationSeconds || durationSeconds < 60) {
    return new NextResponse("Invalid duration", { status: 400 });
  }

  const [newSession] = await db
    .insert(pomodoroSessions)
    .values({
      userId: session.user.id,
      taskId,
      durationSeconds,
      completionDate,
    })
    .returning();

  // Recompute stats
  const allSessions = await db
    .select({
      id: pomodoroSessions.id,
      durationSeconds: pomodoroSessions.durationSeconds,
      completionDate: pomodoroSessions.completionDate,
      taskColor: tasks.color,
    })
    .from(pomodoroSessions)
    .leftJoin(tasks, eq(pomodoroSessions.taskId, tasks.id))
    .where(eq(pomodoroSessions.userId, session.user.id))
    .orderBy(desc(pomodoroSessions.completedAt));

  const todaySessions = allSessions
    .filter((r) => r.completionDate === completionDate)
    .map((r) => ({
      id: r.id,
      color: r.taskColor ?? "#E63946",
      durationSeconds: r.durationSeconds,
    }));

  const uniqueDates = [
    ...new Set(allSessions.map((r) => r.completionDate)),
  ].sort((a, b) => b.localeCompare(a));
  const streak = computeStreak(uniqueDates);

  return NextResponse.json(
    { session: newSession, todaySessions, streak },
    { status: 201 }
  );
}
