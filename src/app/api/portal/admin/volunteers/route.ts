import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { listVolunteers, createVolunteerAccount, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const createVolSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(100),
  role: z.enum(["admin", "supervisor", "supporter"]),
  password: z.string().min(8),
});

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const volunteers = listVolunteers();
    return NextResponse.json({ volunteers });
  } catch (error) {
    console.error("List volunteers error:", error);
    return NextResponse.json({ error: "Failed to list volunteers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || supporter.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin rights required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createVolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid volunteer details. Minimum password length is 8 characters." }, { status: 400 });
    }

    const newVolunteer = createVolunteerAccount({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      password: parsed.data.password,
    });

    logAdminAudit(supporter.id, "CREATE_VOLUNTEER", "volunteer", newVolunteer.id, `Created ${parsed.data.role}: ${parsed.data.displayName}`);

    return NextResponse.json({ volunteer: newVolunteer });
  } catch (error: unknown) {
    console.error("Create volunteer error:", error);
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "A volunteer with this email address already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create volunteer account" }, { status: 500 });
  }
}
