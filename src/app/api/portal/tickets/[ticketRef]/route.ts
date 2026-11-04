import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef, getTicketMessages } from "@/lib/store";
import { getOtherPartyTyping } from "@/lib/typing";

export async function GET(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
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

    // Role check: supervisors and admins can access any ticket; supporters can access unassigned waiting tickets or tickets assigned to them
    if (supporter.role === "supporter" && ticket.assigned_volunteer_id !== supporter.id && (ticket.assigned_volunteer_id || ticket.status !== "waiting")) {
      return NextResponse.json({ error: "Forbidden: You are not authorized to view conversations assigned to other volunteers." }, { status: 403 });
    }

    const messages = getTicketMessages(ticket.id);
    const typing = getOtherPartyTyping(ticket.id, "supporter");

    return NextResponse.json({
      ticket,
      messages,
      typing,
    });
  } catch (error) {
    console.error("Supporter get ticket error:", error);
    return NextResponse.json({ error: "Failed to load ticket" }, { status: 500 });
  }
}
