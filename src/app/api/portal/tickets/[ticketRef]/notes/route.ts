import { NextRequest, NextResponse } from "next/server";
import { getTicketByRef, updateTicketInternalNotes, getVolunteerBySession } from "@/lib/store";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketRef: string }> }
) {
  try {
    const { ticketRef } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("hid_supporter_session")?.value || req.headers.get("x-supporter-session");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized supporter session" }, { status: 401 });
    }

    const supporter = await getVolunteerBySession(sessionToken);
    if (!supporter) {
      return NextResponse.json({ error: "Invalid supporter session" }, { status: 401 });
    }

    const body = await req.json();
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    const ticket = await getTicketByRef(ticketRef);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await updateTicketInternalNotes(ticket.id, notes);

    return NextResponse.json({ success: true, notes });
  } catch (err: unknown) {
    console.error("Update notes error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update internal handover notes" },
      { status: 500 }
    );
  }
}

