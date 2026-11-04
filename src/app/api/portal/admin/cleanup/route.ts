import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { purgeOldClosedTickets } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || supporter.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin credentials required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const days = typeof body?.days === "number" && body.days >= 1 ? body.days : 30;

    const result = await purgeOldClosedTickets(days);

    return NextResponse.json({
      ok: true,
      purgedCount: result.purgedCount,
      message: `Successfully purged ${result.purgedCount} conversation records older than ${days} days.`,
    });
  } catch (error) {
    console.error("Manual cleanup error:", error);
    return NextResponse.json({ error: "Failed to run data shredder" }, { status: 500 });
  }
}

