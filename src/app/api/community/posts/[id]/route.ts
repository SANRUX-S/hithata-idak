import { NextRequest, NextResponse } from "next/server";
import { getCommunityPostById } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getCommunityPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found or unavailable" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err: unknown) {
    console.error("Get community post error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load post details" },
      { status: 500 }
    );
  }
}
