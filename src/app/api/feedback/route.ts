import { NextResponse } from "next/server";
import { createUserFeedback } from "@/lib/store";
import { z } from "zod";

const feedbackSchema = z.object({
  feedbackType: z.string().min(2).max(50),
  rating: z.number().int().min(1).max(5).optional(),
  message: z.string().min(5).max(3000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter your message." }, { status: 400 });
    }

    const id = createUserFeedback({
      feedbackType: parsed.data.feedbackType,
      rating: parsed.data.rating,
      message: parsed.data.message,
    });

    return NextResponse.json({
      ok: true,
      id,
      message: "Thank you for your valuable feedback. Your input helps us maintain a warm, safe, and welcoming environment.",
    });
  } catch (error) {
    console.error("User feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

