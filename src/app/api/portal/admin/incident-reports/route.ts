import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { listIncidentReports } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const reports = listIncidentReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("List incident reports error:", error);
    return NextResponse.json({ error: "Failed to load incident reports" }, { status: 500 });
  }
}
