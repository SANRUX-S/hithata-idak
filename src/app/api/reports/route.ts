import { NextResponse } from "next/server";
import { createIncidentReport } from "@/lib/store";
import { z } from "zod";

const reportSchema = z.object({
  reportType: z.enum(["supporter_behavior", "privacy_concern", "harassment", "platform_misuse", "technical_issue"]),
  ticketRef: z.string().max(30).optional(),
  description: z.string().min(10).max(4000),
  contactEmail: z.string().email().max(150).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please provide a valid report description (minimum 10 characters)." }, { status: 400 });
    }

    const reportId = createIncidentReport({
      reportType: parsed.data.reportType,
      ticketRef: parsed.data.ticketRef,
      description: parsed.data.description,
      contactEmail: parsed.data.contactEmail || undefined,
    });

    return NextResponse.json({
      ok: true,
      reportId,
      message: "Thank you for reporting this. Your report has been securely delivered to platform supervisors for urgent review.",
    });
  } catch (error) {
    console.error("Incident report error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

