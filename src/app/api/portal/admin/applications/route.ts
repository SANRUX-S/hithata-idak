import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { listVolunteerApplications } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const applications = listVolunteerApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("List applications error:", error);
    return NextResponse.json({ error: "Failed to list applications" }, { status: 500 });
  }
}
