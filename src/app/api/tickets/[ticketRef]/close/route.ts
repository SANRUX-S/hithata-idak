import { NextResponse } from "next/server";
import { authenticateVisitor } from "@/lib/api-auth";
import { closeTicket } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const { ticketRef } = await params;
    const { ticket, isAuthorized } = await authenticateVisitor(ticketRef, req);

    if (!ticket || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    closeTicket(ticket.id, "visitor");
    return NextResponse.json({ ok: true, status: "closed" });
  } catch (error) {
    console.error("Close ticket error:", error);
    return NextResponse.json({ error: "Failed to close conversation" }, { status: 500 });
  }
}

