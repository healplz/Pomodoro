import { auth } from "@/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Partial<{ name: string; color: string }> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.color === "string") updates.color = body.color;

  if (!Object.keys(updates).length) {
    return new NextResponse("No valid fields", { status: 400 });
  }

  const [task] = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .returning();

  if (!task) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Soft-delete by setting archivedAt
  const [task] = await db
    .update(tasks)
    .set({ archivedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .returning();

  if (!task) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(null, { status: 204 });
}
