import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupportTicket } from "@/lib/store";
import { z } from "zod";

const createSchema = z.object({
  preferredLanguage: z.enum(["si", "en"]),
  topic: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { ticket, recoveryCode, sessionToken } = createSupportTicket({
      preferredLanguage: parsed.data.preferredLanguage,
      topic: parsed.data.topic,
    });

    const cookieStore = await cookies();
    cookieStore.set("hid_visitor_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      ticket,
      recoveryCode,
      sessionToken,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

