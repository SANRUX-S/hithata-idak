import { NextResponse } from "next/server";
import { purgeOldClosedTickets } from "@/lib/store";

/**
 * Scheduled Cron Cleanup Endpoint (Vercel Cron / External Cron)
 * Automatically purges conversation records older than 30 days per Sri Lankan PDPA.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If a CRON_SECRET is configured, enforce bearer token verification
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    const result = await purgeOldClosedTickets(30);

    return NextResponse.json({
      ok: true,
      purgedCount: result.purgedCount,
      timestamp: new Date().toISOString(),
      message: `Cleaned up ${result.purgedCount} conversation records older than 30 days.`,
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json({ error: "Failed to execute automated cleanup" }, { status: 500 });
  }
}

