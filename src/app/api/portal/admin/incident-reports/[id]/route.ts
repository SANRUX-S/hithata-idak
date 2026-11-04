import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { updateIncidentStatus, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["open", "under_review", "resolved"]),
  resolutionNotes: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status parameters" }, { status: 400 });
    }

    if (!updateIncidentStatus(id, parsed.data.status, parsed.data.resolutionNotes)) {
      return NextResponse.json({ error: "Incident report not found" }, { status: 404 });
    }
    logAdminAudit(supporter.id, "UPDATE_INCIDENT", "incident", id, `Status set to ${parsed.data.status}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update incident error:", error);
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}

