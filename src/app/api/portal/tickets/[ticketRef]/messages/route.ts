import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef, addMessage } from "@/lib/store";
import { setTyping } from "@/lib/typing";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(3000),
});

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

    if (ticket.status === "closed") {
      return NextResponse.json({ error: "This conversation is closed." }, { status: 400 });
    }

    if (supporter.role === "supporter" && ticket.assigned_volunteer_id !== supporter.id) {
      return NextResponse.json({ error: "Please assign this conversation to yourself before sending messages." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    // Clear supporter typing indicator
    setTyping(ticket.id, "supporter", supporter.display_name, false);

    const message = await addMessage(ticket.id, "supporter", supporter.display_name, parsed.data.content);

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Supporter send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
