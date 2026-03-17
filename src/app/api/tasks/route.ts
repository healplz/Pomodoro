import { auth } from "@/auth";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userTasks = await getDb()
    .select()
    .from(tasks)
    .where(eq(tasks.userId, session.user.id));

  // Only return non-archived tasks
  return NextResponse.json(
    userTasks.filter((t) => t.archivedAt === null)
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color : "#E63946";

  if (!name) {
    return new NextResponse("Name is required", { status: 400 });
  }

  const [task] = await getDb()
    .insert(tasks)
    .values({ userId: session.user.id, name, color })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
