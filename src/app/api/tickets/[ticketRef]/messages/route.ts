import { NextResponse } from "next/server";
import { authenticateVisitor } from "@/lib/api-auth";
import { addMessage } from "@/lib/store";
import { setTyping } from "@/lib/typing";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(3000),
});

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const { ticketRef } = await params;
    const { ticket, isAuthorized } = await authenticateVisitor(ticketRef, req);

    if (!ticket) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (ticket.status === "closed") {
      return NextResponse.json({ error: "This conversation has been closed." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Write a message between 1 and 3,000 characters." }, { status: 400 });
    }

    // Clear typing flag on message send
    setTyping(ticket.id, "visitor", "Visitor", false);

    const message = await addMessage(ticket.id, "visitor", "You", parsed.data.content);

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Post visitor message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
