import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { volunteerLogin, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  mfaCode: z.string().optional(), // For admin/supervisor MFA check
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }

    const result = volunteerLogin(parsed.data.email, parsed.data.password);

    if (!result) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("hid_supporter_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    logAdminAudit(result.volunteer.id, "LOGIN", "volunteer", result.volunteer.id, `Role: ${result.volunteer.role}`);

    return NextResponse.json({
      volunteer: result.volunteer,
      sessionToken: result.sessionToken,
    });
  } catch (error) {
    console.error("Volunteer login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

