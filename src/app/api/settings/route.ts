import { auth } from "@/auth";
import { getDb } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await getDb()
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  const pomoDurationMinutes = rows[0]?.pomoDurationMinutes ?? 25;
  return NextResponse.json({ pomoDurationMinutes });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const pomoDurationMinutes = Number(body.pomoDurationMinutes);

  if (!Number.isInteger(pomoDurationMinutes) || pomoDurationMinutes < 1 || pomoDurationMinutes > 120) {
    return new NextResponse("Invalid duration", { status: 400 });
  }

  await getDb()
    .insert(userSettings)
    .values({ userId: session.user.id, pomoDurationMinutes })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { pomoDurationMinutes },
    });

  return NextResponse.json({ pomoDurationMinutes });
}
