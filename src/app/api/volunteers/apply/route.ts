import { NextResponse } from "next/server";
import { createVolunteerApplication } from "@/lib/store";
import { z } from "zod";

const applicationSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(150),
  phone: z.string().max(30).optional(),
  languages: z.string().min(2).max(100),
  motivation: z.string().min(20).max(3000),
  background: z.string().min(10).max(3000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please fill in all required fields thoughtfully." }, { status: 400 });
    }

    const applicationId = createVolunteerApplication({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      languages: parsed.data.languages,
      motivation: parsed.data.motivation,
      background: parsed.data.background,
    });

    return NextResponse.json({
      ok: true,
      applicationId,
      message: "Thank you for your heartfelt interest in joining Hithata Idak. Please note that all volunteer roles require thorough screening, identity verification, emotional listening training, and supervisory sign-off before any support authorization is granted. Our volunteer coordination team will be in touch with next steps.",
    });
  } catch (error) {
    console.error("Volunteer application error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

