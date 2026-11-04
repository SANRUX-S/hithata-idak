import { NextRequest, NextResponse } from "next/server";
import { reactToCommunityPost } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const reactionType = body.reactionType as "warmth" | "alone" | "insight";

    if (!["warmth", "alone", "insight"].includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const updatedReactions = await reactToCommunityPost(id, reactionType);
    return NextResponse.json({ success: true, reactions: updatedReactions });
  } catch (err: unknown) {
    console.error("React to post error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record reaction" },
      { status: 500 }
    );
  }
}
