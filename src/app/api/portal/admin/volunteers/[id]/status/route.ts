import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { updateVolunteerStatus, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const statusSchema = z.object({
  isActive: z.boolean(),
  isApproved: z.boolean(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || supporter.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin rights required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status parameters" }, { status: 400 });
    }

    if (id === supporter.id && (!parsed.data.isActive || !parsed.data.isApproved)) {
      return NextResponse.json({ error: "You cannot suspend or revoke approval for your own administrator account." }, { status: 400 });
    }
    if (!updateVolunteerStatus(id, parsed.data.isActive, parsed.data.isApproved)) {
      return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
    }
    logAdminAudit(supporter.id, "UPDATE_VOLUNTEER_STATUS", "volunteer", id, `Active: ${parsed.data.isActive}, Approved: ${parsed.data.isApproved}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update volunteer status error:", error);
    return NextResponse.json({ error: "Failed to update volunteer status" }, { status: 500 });
  }
}

