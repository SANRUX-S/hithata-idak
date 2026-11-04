import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getPlatformAnalytics } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const analytics = await getPlatformAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Platform analytics error:", error);
    return NextResponse.json({ error: "Failed to load platform analytics" }, { status: 500 });
  }
}

