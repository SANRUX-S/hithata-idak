import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef, closeTicket, logAdminAudit } from "@/lib/store";

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
      return NextResponse.json({ error: "You can only close conversations assigned to you." }, { status: 403 });
    }
    await closeTicket(ticket.id, "supporter");
    await logAdminAudit(supporter.id, "CLOSE_TICKET", "ticket", ticket.id, "Conversation marked closed by supporter");

    return NextResponse.json({ ok: true, status: "closed" });
  } catch (error) {
    console.error("Supporter close ticket error:", error);
    return NextResponse.json({ error: "Failed to close conversation" }, { status: 500 });
  }
}
