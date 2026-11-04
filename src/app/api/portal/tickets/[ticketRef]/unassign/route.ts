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
    const ticket = getTicketByRef(ticketRef);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    unassignTicket(ticket.id);
    logAdminAudit(supporter.id, "UNASSIGN_TICKET", "ticket", ticket.id, "Ticket returned to queue");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unassign ticket error:", error);
    return NextResponse.json({ error: "Failed to return ticket to queue" }, { status: 500 });
  }
}

