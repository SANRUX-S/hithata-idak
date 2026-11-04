import { NextResponse } from "next/server";
import { getSystemAvailability } from "@/lib/store";

export async function GET() {
  try {
    const availability = getSystemAvailability();
    return NextResponse.json(availability, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      {
        status: "offline",
        activeSupportersCount: 0,
        openTicketsCount: 0,
        operatingHours: "8:00 AM - 10:00 PM IST (Sri Lanka Time)",
        pilotMode: true,
      },
      { status: 500 }
    );
  }
}
