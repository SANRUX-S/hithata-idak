import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef, setPriorityReview, setSafetyFlag, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const flagSchema = z.object({
  isPriority: z.boolean().optional(),
  isSafetyFlagged: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketRef } = await params;
    const ticket = await getTicketByRef(ticketRef);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (supporter.role === "supporter" && ticket.assigned_volunteer_id && ticket.assigned_volunteer_id !== supporter.id) {
      return NextResponse.json({ error: "You cannot change a conversation assigned to another supporter." }, { status: 403 });
    }
    const body = await req.json();
    const parsed = flagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid flag parameters" }, { status: 400 });
    }

    if (parsed.data.isPriority !== undefined) {
      await setPriorityReview(ticket.id, parsed.data.isPriority, parsed.data.notes);
      await logAdminAudit(supporter.id, "SET_PRIORITY", "ticket", ticket.id, `Priority: ${parsed.data.isPriority}`);
    }

    if (parsed.data.isSafetyFlagged !== undefined) {
      await setSafetyFlag(ticket.id, parsed.data.isSafetyFlagged, parsed.data.notes);
      await logAdminAudit(supporter.id, "SET_SAFETY_FLAG", "ticket", ticket.id, `Safety flag: ${parsed.data.isSafetyFlagged}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Flag ticket error:", error);
    return NextResponse.json({ error: "Failed to update flags" }, { status: 500 });
  }
}
