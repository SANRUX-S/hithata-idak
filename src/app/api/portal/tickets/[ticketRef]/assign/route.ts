import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef, assignTicket, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const assignSchema = z.object({
  volunteerId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketRef } = await params;
    const ticket = getTicketByRef(ticketRef);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = assignSchema.safeParse(body);

    // Target volunteer ID: either self or specified by supervisor/admin
    let targetVolunteerId = supporter.id;
    if (parsed.success && parsed.data.volunteerId) {
      if (supporter.role === "supporter" && parsed.data.volunteerId !== supporter.id) {
        return NextResponse.json({ error: "Supporters can only assign tickets to themselves" }, { status: 403 });
      }
      targetVolunteerId = parsed.data.volunteerId;
    }

    assignTicket(ticket.id, targetVolunteerId, supporter.id);
    logAdminAudit(supporter.id, "ASSIGN_TICKET", "ticket", ticket.id, `Assigned to ${targetVolunteerId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Assign ticket error:", error);
    return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 });
  }
}

