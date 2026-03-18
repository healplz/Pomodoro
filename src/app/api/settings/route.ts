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

  const { pomoDurationMinutes, waitDurationMinutes, strictWait } = rows[0] ?? {
    pomoDurationMinutes: 25,
    waitDurationMinutes: 5,
    strictWait: false,
  };
  return NextResponse.json({ pomoDurationMinutes, waitDurationMinutes, strictWait });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();

  const pomoDurationMinutes = body.pomoDurationMinutes !== undefined
    ? Number(body.pomoDurationMinutes)
    : undefined;

  const waitDurationMinutes = body.waitDurationMinutes !== undefined
    ? Number(body.waitDurationMinutes)
    : undefined;

  const strictWait = body.strictWait !== undefined
    ? Boolean(body.strictWait)
    : undefined;

  if (pomoDurationMinutes !== undefined) {
    if (!Number.isInteger(pomoDurationMinutes) || pomoDurationMinutes < 1 || pomoDurationMinutes > 120) {
      return new NextResponse("Invalid duration", { status: 400 });
    }
  }

  if (waitDurationMinutes !== undefined) {
    if (![5, 10, 15].includes(waitDurationMinutes)) {
      return new NextResponse("Invalid wait duration", { status: 400 });
    }
  }

  await getDb()
    .insert(userSettings)
    .values({
      userId: session.user.id,
      ...(pomoDurationMinutes !== undefined && { pomoDurationMinutes }),
      ...(waitDurationMinutes !== undefined && { waitDurationMinutes }),
      ...(strictWait !== undefined && { strictWait }),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        ...(pomoDurationMinutes !== undefined && { pomoDurationMinutes }),
        ...(waitDurationMinutes !== undefined && { waitDurationMinutes }),
        ...(strictWait !== undefined && { strictWait }),
      },
    });

  // Fetch updated values to return all three fields
  const rows = await getDb()
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  const result = rows[0] ?? { pomoDurationMinutes: 25, waitDurationMinutes: 5, strictWait: false };
  return NextResponse.json({
    pomoDurationMinutes: result.pomoDurationMinutes,
    waitDurationMinutes: result.waitDurationMinutes,
    strictWait: result.strictWait,
  });
}
