import { NextResponse } from "next/server";
import { authenticateVisitor, authenticateSupporter } from "@/lib/api-auth";
import { getTicketMessages } from "@/lib/store";
import { getOtherPartyTyping } from "@/lib/typing";

export async function GET(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const { ticketRef } = await params;
    const { ticket, isAuthorized: isVisitorAuth } = await authenticateVisitor(ticketRef, req);

    if (!ticket) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check if visitor or supporter is authenticated
    const supporter = await authenticateSupporter(req);
    const isSupporterAuth = supporter && (supporter.role === "admin" || supporter.role === "supervisor" || ticket.assigned_volunteer_id === supporter.id);

    if (!isVisitorAuth && !isSupporterAuth) {
      return NextResponse.json(
        { error: "Unauthorized. Valid session or recovery verification required." },
        { status: 401 }
      );
    }

    const messages = await getTicketMessages(ticket.id);
    const typing = getOtherPartyTyping(ticket.id, "visitor");

    return NextResponse.json({
      ticket,
      messages,
      typing,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}
