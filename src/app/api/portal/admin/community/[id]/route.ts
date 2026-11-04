import { NextRequest, NextResponse } from "next/server";
import { moderateCommunityPost, getVolunteerBySession, logAdminAudit } from "@/lib/store";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("hid_supporter_session")?.value || req.headers.get("x-supporter-session");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized supporter session" }, { status: 401 });
    }

    const supporter = await getVolunteerBySession(sessionToken);
    if (!supporter) {
      return NextResponse.json({ error: "Invalid supporter session" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action as "delete" | "hide" | "approve";

    if (!["delete", "hide", "approve"].includes(action)) {
      return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
    }

    await moderateCommunityPost(id, action);
    await logAdminAudit(
      supporter.id,
      `COMMUNITY_POST_${action.toUpperCase()}`,
      "community_post",
      id,
      `Supporter ${supporter.display_name} performed '${action}' on post ${id}`
    );

    return NextResponse.json({ success: true, action });
  } catch (err: unknown) {
    console.error("Portal community moderation action error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to execute moderation action" },
      { status: 500 }
    );
  }
}
