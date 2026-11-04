import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getTicketByRef, assignTicket, listVolunteers, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const assignSchema = z.object({
  volunteerId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ ticketRef: string }> }) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketRef } = await params;
    const ticket = await getTicketByRef(ticketRef);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid assignment details" }, { status: 400 });

    // Target volunteer ID: either self or specified by supervisor/admin
    let targetVolunteerId = supporter.id;
    if (parsed.success && parsed.data.volunteerId) {
      if (supporter.role === "supporter" && parsed.data.volunteerId !== supporter.id) {
        return NextResponse.json({ error: "Supporters can only assign tickets to themselves" }, { status: 403 });
      }
      targetVolunteerId = parsed.data.volunteerId;
    }

    // Re-read after parsing the body so another claim cannot be silently overwritten.
    const latestTicket = (await getTicketByRef(ticketRef))!;
    if (latestTicket.status === "closed") return NextResponse.json({ error: "This conversation is closed." }, { status: 400 });
    if (supporter.role === "supporter" && latestTicket.assigned_volunteer_id && latestTicket.assigned_volunteer_id !== supporter.id) {
      return NextResponse.json({ error: "This conversation is already assigned to another supporter." }, { status: 409 });
    }
    const target = (await listVolunteers()).find((volunteer) => volunteer.id === targetVolunteerId && volunteer.is_active && volunteer.is_approved);
    if (!target) return NextResponse.json({ error: "Choose an active, approved supporter." }, { status: 400 });
    if (latestTicket.assigned_volunteer_id === targetVolunteerId) return NextResponse.json({ ok: true });

    await assignTicket(ticket.id, targetVolunteerId, supporter.id);
    await logAdminAudit(supporter.id, "ASSIGN_TICKET", "ticket", ticket.id, `Assigned to ${targetVolunteerId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Assign ticket error:", error);
    return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 });
  }
}
