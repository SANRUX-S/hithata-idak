import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { volunteerLogout } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("x-supporter-session") || cookieStore.get("hid_supporter_session")?.value || "";

    if (token) {
      await volunteerLogout(token);
    }

    cookieStore.delete("hid_supporter_session");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
