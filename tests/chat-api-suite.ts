import assert from "node:assert/strict";
import type { SupportTicket, ConversationMessage } from "../src/lib/types";

// Run against a local development server: npx tsx tests/chat-api-suite.ts
const baseURL = process.env.CHAT_TEST_BASE_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseURL).hostname), "API tests must run against a local development server.");

type Conversation = { ticket: SupportTicket; recoveryCode: string; sessionToken: string };
const conversations: Conversation[] = [];
let adminToken = "";

async function request<T>(path: string, options: RequestInit = {}, expectedStatus = 200): Promise<T> {
  const response = await fetch(`${baseURL}${path}`, { ...options, signal: AbortSignal.timeout(60000) });
  const data = await response.json();
  assert.equal(response.status, expectedStatus, `${options.method || "GET"} ${path}: ${JSON.stringify(data)}`);
  return data as T;
}

function post(body: unknown, headers: Record<string, string> = {}): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) };
}

async function run() {
  console.log("Hithata Idak — local chat API flow");
  try {
    for (let index = 0; index < 2; index++) {
      conversations.push(await request<Conversation>("/api/tickets", post({ preferredLanguage: index ? "si" : "en", topic: `API verification ${Date.now()} ${index}` })));
    }
    const [first, second] = conversations;
    const visitorHeaders = { "x-visitor-session": first.sessionToken, Cookie: `hid_visitor_session=${second.sessionToken}` };
    const firstPath = `/api/tickets/${first.ticket.ticket_ref}`;
    const secondPath = `/api/tickets/${second.ticket.ticket_ref}`;

    const initial = await request<{ ticket: SupportTicket; messages: ConversationMessage[] }>(firstPath, { headers: visitorHeaders });
    assert.equal(initial.ticket.ticket_ref, first.ticket.ticket_ref, "Per-tab credentials must win over another tab's cookie.");
    assert.equal(initial.messages[0].sender_role, "system");
    await request(firstPath, { headers: { "x-visitor-session": "wrong-session", Cookie: `hid_visitor_session=${first.sessionToken}` } }, 401);
    await request(`${firstPath}/messages`, post({ content: "   " }, visitorHeaders), 400);
    const content = "මට කතා කරන්න කෙනෙක් ඕනේ. A local integration test 💜";
    const sent = await request<{ message: ConversationMessage }>(`${firstPath}/messages`, post({ content }, visitorHeaders));
    assert.equal(sent.message.content, content);
    console.log("PASS: anonymous creation, per-tab access, unauthorized access, validation, Sinhala/English message");

    const login = await request<{ sessionToken: string }>("/api/portal/auth/login", post({ email: process.env.CHAT_TEST_ADMIN_EMAIL || "admin@hithataidak.lk", password: process.env.CHAT_TEST_ADMIN_PASSWORD || "AdminSafePassword2026!" }));
    adminToken = login.sessionToken;
    const adminHeaders = { "x-supporter-session": adminToken };
    await request(`/api/portal/tickets/${first.ticket.ticket_ref}/assign`, post({}, adminHeaders));
    await request(`/api/portal/tickets/${first.ticket.ticket_ref}/typing`, post({ isTyping: true }, adminHeaders));
    const typing = await request<{ typing: { isTyping: boolean } }>(firstPath, { headers: visitorHeaders });
    assert.equal(typing.typing.isTyping, true, "Typing pings must be visible across route bundles.");
    const reply = "Integration-test reply from the supporter console.";
    await request(`/api/portal/tickets/${first.ticket.ticket_ref}/messages`, post({ content: reply }, adminHeaders));
    const updated = await request<{ ticket: SupportTicket; messages: ConversationMessage[] }>(firstPath, { headers: visitorHeaders });
    assert.equal(updated.messages.at(-1)?.content, reply);
    assert.equal(updated.messages.at(-1)?.sender_role, "supporter");
    assert.equal(updated.ticket.status, "awaiting_reply");
    console.log("PASS: supporter login, assignment, typing, reply, visitor retrieval");

    await request(`${firstPath}/close`, post({}, visitorHeaders));
    await request(`${firstPath}/close`, post({}, visitorHeaders));
    await request(`${firstPath}/messages`, post({ content: "Should not send" }, visitorHeaders), 400);
    const resumed = await request<{ sessionToken: string }>("/api/tickets/resume", post({ ticketRef: second.ticket.ticket_ref, recoveryCode: second.recoveryCode }));
    await request(secondPath, { headers: { "x-visitor-session": second.sessionToken } }, 401);
    second.sessionToken = resumed.sessionToken;
    await request(secondPath, { headers: { "x-visitor-session": second.sessionToken } });
    console.log("PASS: idempotent close, closed chat rejection, secure recovery, old session revocation");
  } finally {
    // Only these newly created conversations are eligible for cleanup.
    if (adminToken) {
      const adminHeaders = { "x-supporter-session": adminToken };
      for (const conversation of conversations) {
        await request(`/api/tickets/${conversation.ticket.ticket_ref}/delete-request`, post({}, { "x-visitor-session": conversation.sessionToken }));
        await request(`/api/portal/admin/privacy-requests/${conversation.ticket.id}/process`, post({}, adminHeaders));
        await request(`/api/tickets/${conversation.ticket.ticket_ref}`, { headers: { "x-visitor-session": conversation.sessionToken } }, 401);
      }
      await request("/api/portal/auth/logout", post({}, adminHeaders));
      console.log("PASS: deletion requests processed, message access revoked, test session logged out");
    }
  }
  console.log("All local chat API checks passed.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
