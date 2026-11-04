import { NextRequest, NextResponse } from "next/server";
import { getCommunityPosts, createCommunityPost } from "@/lib/store";
import { checkContentSafety } from "@/lib/moderation";
import { CommunityCategory } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";
    const posts = await getCommunityPosts({ category });
    return NextResponse.json({ posts });
  } catch (err: unknown) {
    console.error("Fetch community posts error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load community discussions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const authorAlias = typeof body.authorAlias === "string" && body.authorAlias.trim() ? body.authorAlias.trim() : "Anonymous Friend";
    const category = (body.category || "feelings") as CommunityCategory;

    if (!title || title.length < 5) {
      return NextResponse.json({ error: "Please provide a clear title (at least 5 characters)." }, { status: 400 });
    }

    if (!content || content.length < 10) {
      return NextResponse.json({ error: "Please write what is on your heart (at least 10 characters)." }, { status: 400 });
    }

    // Safety and toxicity moderation check
    const titleSafety = checkContentSafety(title);
    if (!titleSafety.isSafe) {
      return NextResponse.json({ error: titleSafety.reason }, { status: 422 });
    }

    const contentSafety = checkContentSafety(content);
    if (!contentSafety.isSafe) {
      return NextResponse.json({ error: contentSafety.reason }, { status: 422 });
    }

    const post = await createCommunityPost(title, content, authorAlias, category);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create community post error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to publish community post" },
      { status: 500 }
    );
  }
}
