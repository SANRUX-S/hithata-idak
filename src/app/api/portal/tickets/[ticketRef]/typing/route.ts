import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef } from "@/lib/store";
import { setTyping } from "@/lib/typing";
import { z } from "zod";

const typingSchema = z.object({
  isTyping: z.boolean(),
});

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
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

    const body = await req.json();
    const parsed = typingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid typing state" }, { status: 400 });
    }

    setTyping(ticket.id, "supporter", supporter.display_name, parsed.data.isTyping);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update typing indicator" }, { status: 500 });
  }
}

