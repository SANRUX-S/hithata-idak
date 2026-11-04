import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { setVolunteerAvailability } from "@/lib/store";
import { z } from "zod";

const availSchema = z.object({
  status: z.enum(["online", "busy", "offline"]),
});

export async function POST(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = availSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid availability status" }, { status: 400 });
    }

    await setVolunteerAvailability(supporter.id, parsed.data.status);
    return NextResponse.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    console.error("Set availability error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
