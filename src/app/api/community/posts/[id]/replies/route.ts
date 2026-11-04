import { NextRequest, NextResponse } from "next/server";
import { addCommunityReply, getCommunityPostById, getVolunteerBySession } from "@/lib/store";
import { checkContentSafety } from "@/lib/moderation";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    let authorAlias = typeof body.authorAlias === "string" && body.authorAlias.trim() ? body.authorAlias.trim() : "Helpful Peer";

    if (!content || content.length < 3) {
      return NextResponse.json({ error: "Reply cannot be empty (at least 3 characters)." }, { status: 400 });
    }

    // Safety and toxicity moderation check
    const safety = checkContentSafety(content);
    if (!safety.isSafe) {
      return NextResponse.json({ error: safety.reason }, { status: 422 });
    }

    const post = await getCommunityPostById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if reply is from verified duty supporter
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("hid_supporter_session")?.value || req.headers.get("x-supporter-session");
    let isSupporter = false;
    if (sessionToken) {
      const vol = await getVolunteerBySession(sessionToken);
      if (vol) {
        isSupporter = true;
        authorAlias = `${vol.display_name} (Hithata Idak Supporter)`;
      }
    }

    const reply = await addCommunityReply(id, content, authorAlias, isSupporter);
    return NextResponse.json({ reply }, { status: 201 });
  } catch (err: unknown) {
    console.error("Add community reply error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to post supportive reply" },
      { status: 500 }
    );
  }
}
