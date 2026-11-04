import { NextRequest, NextResponse } from "next/server";
import { getCommunityPosts, getVolunteerBySession } from "@/lib/store";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("hid_supporter_session")?.value || req.headers.get("x-supporter-session");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized supporter session" }, { status: 401 });
    }

    const supporter = await getVolunteerBySession(sessionToken);
    if (!supporter) {
      return NextResponse.json({ error: "Invalid supporter session" }, { status: 401 });
    }

    // Supporters can see all active and flagged posts for moderation
    const posts = await getCommunityPosts({ includeFlagged: true });
    return NextResponse.json({ posts });
  } catch (err: unknown) {
    console.error("Portal community moderation fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load community moderation feed" },
      { status: 500 }
    );
  }
}
