import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resumeTicketWithRecoveryCode } from "@/lib/store";
import { z } from "zod";

const resumeSchema = z.object({
  ticketRef: z.string().min(4).max(30),
  recoveryCode: z.string().min(8).max(64),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resumeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid ticket reference or recovery key format." }, { status: 400 });
    }

    const result = resumeTicketWithRecoveryCode(parsed.data.ticketRef, parsed.data.recoveryCode);

    if (!result) {
      return NextResponse.json(
        { error: "Invalid ticket reference or recovery key. For privacy and security, conversation details cannot be accessed without the matching private recovery key." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("hid_visitor_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      ticket: result.ticket,
      sessionToken: result.sessionToken,
    });
  } catch (error) {
    console.error("Resume ticket error:", error);
    return NextResponse.json({ error: "Failed to resume conversation" }, { status: 500 });
  }
}

