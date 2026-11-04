import { NextRequest, NextResponse } from "next/server";
import { reportCommunityPost, getCommunityPostById } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "Flagged by community user";

    const post = await getCommunityPostById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await reportCommunityPost(id, reason);
    return NextResponse.json({ success: true, message: "Thank you. Our moderation team has been notified." });
  } catch (err: unknown) {
    console.error("Report post error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit report" },
      { status: 500 }
    );
  }
}
