import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketById, processConversationDeletion } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || supporter.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Administrator rights required to execute permanent data shredding." }, { status: 403 });
    }

    const { ticketId } = await params;
    const ticket = getTicketById(ticketId);
    if (!ticket) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    if (!ticket.deletion_requested) return NextResponse.json({ error: "No deletion request exists for this conversation." }, { status: 400 });
    processConversationDeletion(ticketId, supporter.id);

    return NextResponse.json({
      ok: true,
      message: "Conversation data permanently shredded from database.",
    });
  } catch (error) {
    console.error("Process deletion error:", error);
    return NextResponse.json({ error: "Failed to process data deletion" }, { status: 500 });
  }
}

