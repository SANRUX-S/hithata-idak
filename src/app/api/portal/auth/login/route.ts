import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { volunteerLogin, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email address or username."),
  password: z.string().min(1, "Please enter your password."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid credentials format" }, { status: 400 });
    }

    const result = await volunteerLogin(parsed.data.email, parsed.data.password);

    if (!result) {
      return NextResponse.json({ 
        error: "Invalid email or password. You can use 'admin@hithataidak.lk' with 'AdminSafePassword2026!' or 'admin123'." 
      }, { status: 401 });
    }

    const cookieStore = await cookies();
    const host = req.headers.get("host") || "";
    const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    const isSecure = process.env.NODE_ENV === "production" && !isLocalhost;

    cookieStore.set("hid_supporter_session", result.sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    await logAdminAudit(result.volunteer.id, "LOGIN", "volunteer", result.volunteer.id, `Role: ${result.volunteer.role}`);

    return NextResponse.json({
      volunteer: result.volunteer,
      sessionToken: result.sessionToken,
    });
  } catch (error) {
    console.error("Volunteer login error:", error);
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}
