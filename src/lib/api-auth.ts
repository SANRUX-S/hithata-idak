import { cookies } from "next/headers";
import { getVolunteerBySession, verifyVisitorSession, getTicketByRef } from "./store";
import { Volunteer, SupportTicket } from "./types";

/**
 * Validates the visitor session for a given ticket.
 * Checks cookie 'hid_visitor_session' or 'x-visitor-session' header.
 */
export async function authenticateVisitor(ticketRef: string, request?: Request): Promise<{ ticket: SupportTicket; isAuthorized: boolean }> {
  const ticket = getTicketByRef(ticketRef);
  if (!ticket) {
    return { ticket: null as unknown as SupportTicket, isAuthorized: false };
  }

  const cookieStore = await cookies();
  // A tab's explicit session must win over the cookie shared with other conversations.
  const sessionToken = request?.headers.get("x-visitor-session") || cookieStore.get("hid_visitor_session")?.value || "";

  const isAuthorized = verifyVisitorSession(ticket.id, sessionToken);
  return { ticket, isAuthorized };
}

/**
 * Validates the supporter/administrator session.
 * Checks cookie 'hid_supporter_session' or 'x-supporter-session' header.
 */
export async function authenticateSupporter(request?: Request): Promise<Volunteer | null> {
  const cookieStore = await cookies();
  const sessionToken = request?.headers.get("x-supporter-session") || cookieStore.get("hid_supporter_session")?.value || "";

  if (!sessionToken) return null;
  return getVolunteerBySession(sessionToken);
}

