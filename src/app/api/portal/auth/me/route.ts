import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getVolunteerAvailability } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availability = getVolunteerAvailability(supporter.id);

    return NextResponse.json({
      supporter,
      availability,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
