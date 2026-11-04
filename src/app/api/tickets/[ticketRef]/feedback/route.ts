import { NextResponse } from "next/server";
import { authenticateVisitor } from "@/lib/api-auth";
import { submitFeedback } from "@/lib/store";
import { z } from "zod";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const { ticketRef } = await params;
    const { ticket, isAuthorized } = await authenticateVisitor(ticketRef, req);

    if (!ticket || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feedback parameters" }, { status: 400 });
    }

    await submitFeedback(ticket.id, parsed.data.rating, parsed.data.text);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
