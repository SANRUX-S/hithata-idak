import { NextResponse } from "next/server";
import { authenticateVisitor } from "@/lib/api-auth";
import { setTyping } from "@/lib/typing";
import { z } from "zod";

const typingSchema = z.object({
  isTyping: z.boolean(),
});

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const { ticketRef } = await params;
    const { ticket, isAuthorized } = await authenticateVisitor(ticketRef, req);

    if (!ticket || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = typingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid typing state" }, { status: 400 });
    }

    setTyping(ticket.id, "visitor", "Visitor", parsed.data.isTyping);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update typing indicator" }, { status: 500 });
  }
}

