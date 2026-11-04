import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef, unassignTicket, logAdminAudit } from "@/lib/store";

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

    if (supporter.role === "supporter" && ticket.assigned_volunteer_id !== supporter.id) {
      return NextResponse.json({ error: "You can only return conversations assigned to you." }, { status: 403 });
    }
    if (ticket.status === "closed") return NextResponse.json({ error: "This conversation is closed." }, { status: 400 });
    await unassignTicket(ticket.id);
    await logAdminAudit(supporter.id, "UNASSIGN_TICKET", "ticket", ticket.id, "Ticket returned to queue");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unassign ticket error:", error);
    return NextResponse.json({ error: "Failed to return ticket to queue" }, { status: 500 });
  }
}
