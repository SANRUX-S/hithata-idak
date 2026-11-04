import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { processConversationDeletion } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || supporter.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Administrator rights required to execute permanent data shredding." }, { status: 403 });
    }

    const { ticketId } = await params;
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

