import { NextResponse } from "next/server";
import { authenticateVisitor } from "@/lib/api-auth";
import { requestConversationDeletion } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const { ticketRef } = await params;
    const { ticket, isAuthorized } = await authenticateVisitor(ticketRef, req);

    if (!ticket || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requestConversationDeletion(ticket.id, ticket.ticket_ref);
    return NextResponse.json({
      ok: true,
      message: "Data deletion requested. In accordance with privacy standards and Sri Lankan Personal Data Protection Act guidelines, your conversation content has been queued for immediate cryptographic shredding.",
    });
  } catch (error) {
    console.error("Delete request error:", error);
    return NextResponse.json({ error: "Failed to request deletion" }, { status: 500 });
  }
}
