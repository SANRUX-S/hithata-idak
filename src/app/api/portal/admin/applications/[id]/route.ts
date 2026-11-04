import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { updateVolunteerApplicationStatus, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "interview_scheduled", "training", "approved", "rejected"]),
  notes: z.string().max(2000).optional(),
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

    updateVolunteerApplicationStatus(id, parsed.data.status, parsed.data.notes);
    logAdminAudit(supporter.id, "UPDATE_APPLICATION", "application", id, `Status set to ${parsed.data.status}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "Failed to update application status" }, { status: 500 });
  }
}

