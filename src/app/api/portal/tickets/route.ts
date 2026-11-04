import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { listQueueTickets, touchVolunteerPresence } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await touchVolunteerPresence(supporter.id);
    const allTickets = await listQueueTickets();

    // If regular volunteer, return tickets assigned to them OR tickets waiting in the queue.
    // They cannot browse conversations assigned to other volunteers without supervisor role.
    const filteredTickets = supporter.role === "supporter"
      ? allTickets.filter((t) => t.status === "waiting" || t.assigned_volunteer_id === supporter.id)
      : allTickets;

    return NextResponse.json({ tickets: filteredTickets });
  } catch (error) {
    console.error("List tickets error:", error);
    return NextResponse.json({ error: "Failed to list tickets" }, { status: 500 });
  }
}
