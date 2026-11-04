import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import type { AdminAuditEvent, IncidentReport, PrivacyRequest, SupportTicket, UserFeedback, Volunteer, VolunteerApplication } from "../src/lib/types";

// Run after npm run build. Every request uses a separate server with a disposable in-memory DB.
async function main() {
  const portReservation = createServer();
  await new Promise<void>((resolve) => portReservation.listen(0, "127.0.0.1", resolve));
  const address = portReservation.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((resolve, reject) => portReservation.close((error) => error ? reject(error) : resolve()));
  const server = spawn(process.execPath, [path.join(process.cwd(), "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_PATH: ":memory:" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  for (const stream of [server.stdout, server.stderr]) stream?.on("data", (chunk) => { logs = (logs + String(chunk)).slice(-6000); });
  const baseURL = `http://127.0.0.1:${port}`;
  async function request<T = { ok: boolean }>(route: string, options: RequestInit = {}, expected = 200): Promise<T> {
    const response = await fetch(`${baseURL}${route}`, { ...options, signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    assert.equal(response.status, expected, `${options.method || "GET"} ${route}: ${JSON.stringify(data)}`);
    return data as T;
  }
  const headers = (token: string) => ({ "x-supporter-session": token });
  const post = (body: unknown, token = ""): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json", ...(token ? headers(token) : {}) }, body: JSON.stringify(body) });
  let passed = 0;
  const test = async (name: string, check: () => Promise<void>) => { await check(); passed++; console.log(`PASS: ${name}`); };
  try {
    const deadline = Date.now() + 60000;
    let ready = false;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) throw new Error(`Isolated server exited: ${logs}`);
      try { const response = await fetch(`${baseURL}/api/availability`, { signal: AbortSignal.timeout(2000) }); ready = response.ok; } catch { /* Wait for this server to become ready. */ }
      if (ready) break;
      await pause(250);
    }
    assert.ok(ready, `Isolated server did not become ready: ${logs}`);
    async function login(email: string, password: string) { return request<{ sessionToken: string; volunteer: Volunteer }>("/api/portal/auth/login", post({ email, password })); }
    const admin = await login("admin@hithataidak.lk", "AdminSafePassword2026!");
    const supervisor = await login("supervisor@hithataidak.lk", "SupervisorSafePassword2026!");
    const supporter = await login("supporter@hithataidak.lk", "SupporterSafePassword2026!");

    await test("Protected admin routes reject anonymous visitors and regular supporters", async () => {
      for (const route of ["applications", "incident-reports", "volunteers", "settings", "feedback", "audit", "privacy-requests"]) {
        await request(`/api/portal/admin/${route}`, {}, 403);
        await request(`/api/portal/admin/${route}`, { headers: headers(supporter.sessionToken) }, 403);
      }
      const me = await request<{ supporter: Volunteer & { password_hash?: string } }>("/api/portal/auth/me", { headers: headers(admin.sessionToken) });
      assert.equal(me.supporter.password_hash, undefined);
    });

    await test("Applications submit, review, save/clear notes, and reject missing records", async () => {
      const created = await request<{ applicationId: string }>("/api/volunteers/apply", post({ fullName: "Test Applicant", email: "applicant@example.test", languages: "Sinhala, English", motivation: "I would like to volunteer and listen carefully to others.", background: "I have experience in community volunteering." }));
      const route = `/api/portal/admin/applications/${created.applicationId}`;
      await request(route, post({ status: "interview_scheduled", notes: "Interview planned" }, supervisor.sessionToken));
      let listed = await request<{ applications: VolunteerApplication[] }>("/api/portal/admin/applications", { headers: headers(admin.sessionToken) });
      assert.equal(listed.applications[0].status, "interview_scheduled"); assert.equal(listed.applications[0].notes, "Interview planned");
      await request(route, post({ status: "approved", notes: "" }, admin.sessionToken));
      listed = await request("/api/portal/admin/applications", { headers: headers(admin.sessionToken) });
      assert.equal(listed.applications[0].notes, "");
      await request("/api/portal/admin/applications/missing", post({ status: "approved" }, admin.sessionToken), 404);
      await request(route, post({ status: "invalid" }, admin.sessionToken), 400);
    });

    await test("Incident reports expose full descriptions and support triage/resolution notes", async () => {
      const created = await request<{ reportId: string }>("/api/reports", post({ reportType: "technical_issue", description: "A full technical test report for review and resolution." }));
      await request(`/api/portal/admin/incident-reports/${created.reportId}`, post({ status: "resolved", resolutionNotes: "Verified and resolved" }, supervisor.sessionToken));
      const listed = await request<{ reports: IncidentReport[] }>("/api/portal/admin/incident-reports", { headers: headers(admin.sessionToken) });
      assert.equal(listed.reports[0].status, "resolved"); assert.equal(listed.reports[0].resolution_notes, "Verified and resolved");
      await request("/api/portal/admin/incident-reports/missing", post({ status: "resolved" }, admin.sessionToken), 404);
    });

    await test("Volunteer creation, suspension, approval revocation and session invalidation work", async () => {
      const account = await request<{ volunteer: Volunteer }>("/api/portal/admin/volunteers", post({ email: "new-supporter@example.test", displayName: "Test Supporter", role: "supporter", password: "TestSupporterPassword2026!" }, admin.sessionToken));
      const signedIn = await login("new-supporter@example.test", "TestSupporterPassword2026!");
      const statusRoute = `/api/portal/admin/volunteers/${account.volunteer.id}/status`;
      await request(statusRoute, post({ isActive: false, isApproved: true }, supervisor.sessionToken), 403);
      await request(statusRoute, post({ isActive: false, isApproved: true }, admin.sessionToken));
      await request("/api/portal/auth/me", { headers: headers(signedIn.sessionToken) }, 401);
      await request(statusRoute, post({ isActive: true, isApproved: false }, admin.sessionToken));
      await request("/api/portal/auth/login", post({ email: "new-supporter@example.test", password: "TestSupporterPassword2026!" }), 401);
      await request(statusRoute, post({ isActive: true, isApproved: true }, admin.sessionToken));
      await request("/api/portal/auth/me", { headers: headers(signedIn.sessionToken) }, 401);
      await login("new-supporter@example.test", "TestSupporterPassword2026!");
      await request(`/api/portal/admin/volunteers/${admin.volunteer.id}/status`, post({ isActive: false, isApproved: true }, admin.sessionToken), 400);
      await request("/api/portal/admin/volunteers/missing/status", post({ isActive: true, isApproved: true }, admin.sessionToken), 404);
    });

    await test("Settings save all fields, validate policy values and respect admin permissions", async () => {
      const settings = { serviceStatus: "offline", pilotMode: "false", operatingHours: "Test hours only", retentionDays: "7" };
      await request("/api/portal/admin/settings", post(settings, supervisor.sessionToken), 403);
      await request("/api/portal/admin/settings", post(settings, admin.sessionToken));
      assert.deepEqual(await request("/api/portal/admin/settings", { headers: headers(admin.sessionToken) }), settings);
      await request("/api/portal/admin/settings", post({ retentionDays: "invalid" }, admin.sessionToken), 400);
      await request("/api/portal/admin/settings", post({ operatingHours: " " }, admin.sessionToken), 400);
      const availability = await request<{ status: string }>("/api/availability"); assert.equal(availability.status, "offline");
    });

    await test("Visitor feedback is available to supervisors and administrators", async () => {
      await request("/api/feedback", post({ feedbackType: "general", rating: 5, message: "Helpful and clear test experience." }));
      const listed = await request<{ feedback: UserFeedback[] }>("/api/portal/admin/feedback", { headers: headers(supervisor.sessionToken) });
      assert.equal(listed.feedback[0].rating, 5); assert.equal(listed.feedback[0].message, "Helpful and clear test experience.");
    });

    await test("Supporters cannot steal, view, close, unassign or flag another supporter's chat", async () => {
      const conversation = await request<{ ticket: SupportTicket; sessionToken: string }>("/api/tickets", post({ preferredLanguage: "en" }));
      const route = `/api/portal/tickets/${conversation.ticket.ticket_ref}`;
      await request(`${route}/assign`, post({}, admin.sessionToken));
      await request(`${route}/assign`, post({}, admin.sessionToken));
      await request(`${route}/assign`, post({}, supporter.sessionToken), 409);
      await request(route, { headers: headers(supporter.sessionToken) }, 403);
      for (const action of ["close", "unassign"]) await request(`${route}/${action}`, post({}, supporter.sessionToken), 403);
      await request(`${route}/flag`, post({ isPriority: true }, supporter.sessionToken), 403);
      await request(`${route}/close`, post({}, admin.sessionToken));
      await request(`${route}/assign`, post({}, admin.sessionToken), 400);
    });

    await test("Privacy deletion requires a real request and administrator access", async () => {
      const conversation = await request<{ ticket: SupportTicket; sessionToken: string }>("/api/tickets", post({ preferredLanguage: "en" }));
      const processRoute = `/api/portal/admin/privacy-requests/${conversation.ticket.id}/process`;
      await request(processRoute, post({}, admin.sessionToken), 400);
      await request(`/api/tickets/${conversation.ticket.ticket_ref}/delete-request`, { ...post({}), headers: { "Content-Type": "application/json", "x-visitor-session": conversation.sessionToken } });
      await request(processRoute, post({}, supervisor.sessionToken), 403);
      await request(processRoute, post({}, admin.sessionToken));
      const listed = await request<{ requests: PrivacyRequest[] }>("/api/portal/admin/privacy-requests", { headers: headers(admin.sessionToken) });
      assert.equal(listed.requests[0].status, "processed");
      await request(`/api/tickets/${conversation.ticket.ticket_ref}`, { headers: { "x-visitor-session": conversation.sessionToken } }, 401);
      await request("/api/portal/admin/privacy-requests/missing/process", post({}, admin.sessionToken), 404);
    });

    await test("Audit records capture review/account/settings actions without private message text", async () => {
      const { auditEvents } = await request<{ auditEvents: AdminAuditEvent[] }>("/api/portal/admin/audit", { headers: headers(admin.sessionToken) });
      for (const action of ["UPDATE_APPLICATION", "UPDATE_INCIDENT", "UPDATE_VOLUNTEER_STATUS", "UPDATE_SETTINGS", "DELETE_CONVERSATION"]) assert.ok(auditEvents.some((event) => event.action === action), `Missing audit ${action}`);
      assert.ok(auditEvents.every((event) => !event.details_safe.includes("Verified and resolved")));
    });
    console.log(`All ${passed} isolated admin API checks passed. No live records were changed.`);
  } finally {
    server.kill();
    await new Promise<void>((resolve) => { if (server.exitCode !== null) resolve(); else { server.once("exit", () => resolve()); setTimeout(resolve, 5000).unref(); } });
  }
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
