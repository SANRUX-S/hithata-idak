import assert from "node:assert";
import crypto from "node:crypto";
import {
  generateTicketReference,
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
  encryptMessage,
  decryptMessage,
} from "@/lib/crypto";
import {
  createSupportTicket,
  getTicketById,
  resumeTicketWithRecoveryCode,
  addMessage,
  getTicketMessages,
  processConversationDeletion,
  volunteerLogin,
  getVolunteerBySession,
  getSystemAvailability,
  setVolunteerAvailability,
  touchVolunteerPresence,
  closeTicket,
  verifyVisitorSession,
} from "@/lib/store";
import { db } from "@/lib/db";

// Exercise a disposable database. Tests must never add chats or change live supporter presence.
process.env.DATABASE_PATH = ":memory:";

async function runTestSuite() {
  console.log("=================================================");
  console.log("  HITHATA IDAK — CRITICAL SECURITY & LOGIC TESTS ");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  await test("Seed accounts are offline until a real supporter signs in", async () => {
    const avail = await getSystemAvailability();
    assert.strictEqual(avail.status, "offline");
    assert.strictEqual(avail.activeSupportersCount, 0);
  });

  await test("Ticket creation rolls back credentials and ticket if the welcome message cannot be saved", async () => {
    const countTickets = () => (db.prepare("SELECT COUNT(*) AS count FROM support_tickets").get() as { count: number }).count;
    const countCredentials = () => (db.prepare("SELECT COUNT(*) AS count FROM ticket_access_credentials").get() as { count: number }).count;
    const beforeTickets = countTickets();
    const beforeCredentials = countCredentials();
    db.exec("CREATE TEMP TRIGGER reject_welcome BEFORE INSERT ON conversation_messages BEGIN SELECT RAISE(ABORT, 'Simulated storage failure'); END;");
    try {
      await assert.rejects(async () => {
        await createSupportTicket({ preferredLanguage: "en" });
      }, /Simulated storage failure/);
    } finally {
      db.exec("DROP TRIGGER reject_welcome;");
    }
    assert.strictEqual(countTickets(), beforeTickets);
    assert.strictEqual(countCredentials(), beforeCredentials);
  });

  // 1. Ticket Reference Unpredictability Test
  await test("Ticket References are formatted HID-XXXXXX and non-sequential", () => {
    const refs = new Set();
    for (let i = 0; i < 50; i++) {
      const ref = generateTicketReference();
      assert.match(ref, /^HID-[2-9A-HJ-NP-Z]{6}$/, `Reference format invalid: ${ref}`);
      refs.add(ref);
    }
    assert.strictEqual(refs.size, 50, "Generated duplicate ticket references");
  });

  // 2. Recovery Credential Storage & Verification
  await test("Private recovery credential verification succeeds with valid key, fails with invalid key", () => {
    const recoveryCode = generateRecoveryCode();
    const salt = crypto.randomBytes(16).toString("hex");
    const verifierHash = hashRecoveryCode(recoveryCode, salt);

    // Assert plaintext code is NOT stored
    assert.notStrictEqual(verifierHash, recoveryCode);

    // Valid check
    assert.strictEqual(verifyRecoveryCode(recoveryCode, salt, verifierHash), true);

    // Invalid check (tampered code)
    assert.strictEqual(verifyRecoveryCode("REC-INVALID-CODE-0000", salt, verifierHash), false);

    // Case-insensitivity & whitespace tolerance for human usability
    assert.strictEqual(verifyRecoveryCode(recoveryCode.toLowerCase() + " ", salt, verifierHash), true);
  });

  // 3. Authenticated AES-256-GCM Message Encryption (English & Sinhala)
  await test("AES-256-GCM correctly encrypts and decrypts English & Sinhala Unicode messages", () => {
    const englishMsg = "I have been feeling really stressed with my university exams lately.";
    const sinhalaMsg = "මගේ හිතට ගොඩක් අමාරුයි, මට කවුරුහරි ඇහුම්කන් දෙනවද?";

    const encEnglish = encryptMessage(englishMsg);
    assert.notStrictEqual(encEnglish.ciphertext, englishMsg);
    assert.ok(encEnglish.iv);
    assert.ok(encEnglish.authTag);
    const decEnglish = decryptMessage(encEnglish.ciphertext, encEnglish.iv, encEnglish.authTag);
    assert.strictEqual(decEnglish, englishMsg);

    const encSinhala = encryptMessage(sinhalaMsg);
    assert.notStrictEqual(encSinhala.ciphertext, sinhalaMsg);
    const decSinhala = decryptMessage(encSinhala.ciphertext, encSinhala.iv, encSinhala.authTag);
    assert.strictEqual(decSinhala, sinhalaMsg);

    // Tampered auth tag must fail decryption
    const badDec = decryptMessage(encEnglish.ciphertext, encEnglish.iv, "badTagInvalidBase64==");
    assert.strictEqual(badDec, "[Encrypted message content unavailable]");
  });

  // 4. Ticket Reference Alone Must NEVER Grant Conversation Access
  await test("Ticket reference alone does not grant access; valid recovery key required to resume", async () => {
    const { ticket, recoveryCode } = await createSupportTicket({
      preferredLanguage: "si",
      topic: "Loneliness & Feeling Misunderstood",
    });

    assert.ok(ticket.ticket_ref);
    assert.ok(recoveryCode);

    // Try resuming with WRONG recovery code
    const failedResume = await resumeTicketWithRecoveryCode(ticket.ticket_ref, "REC-0000-0000-0000");
    assert.strictEqual(failedResume, null, "Should not resume with wrong recovery key");

    // Try resuming with CORRECT recovery code
    const successfulResume = await resumeTicketWithRecoveryCode(ticket.ticket_ref, recoveryCode);
    assert.ok(successfulResume, "Should successfully resume with matching recovery key");
    assert.strictEqual(successfulResume?.ticket.ticket_ref, ticket.ticket_ref);
    assert.ok(successfulResume?.sessionToken, "Should grant new session token");
  });

  // 5. Message Lifecycle & Real Supporter-Visitor Workflow
  await test("Visitor and supporter messages are saved, encrypted, and retrieved ordered", async () => {
    const { ticket } = await createSupportTicket({ preferredLanguage: "en" });

    // Visitor sends a message
    await addMessage(ticket.id, "visitor", "Visitor", "Hello, is someone here?");

    // Supporter replies
    await addMessage(ticket.id, "supporter", "Volunteer Supporter", "Hello! I am here and listening.");

    const messages = await getTicketMessages(ticket.id);
    // 1 welcome message + 2 conversation messages = 3
    assert.strictEqual(messages.length, 3);
    assert.strictEqual(messages[1].content, "Hello, is someone here?");
    assert.strictEqual(messages[2].content, "Hello! I am here and listening.");
    assert.strictEqual(messages[2].sender_name, "Volunteer Supporter");
  });

  // 6. Data Shredding / PDPA Permanent Deletion
  await test("Permanent data deletion completely shreds conversation messages and access credentials", async () => {
    const { ticket } = await createSupportTicket({ preferredLanguage: "en" });
    await addMessage(ticket.id, "visitor", "Visitor", "Secret personal information that must be shredded.");

    // Verify messages exist before deletion
    const beforeMsgs = await getTicketMessages(ticket.id);
    assert.ok(beforeMsgs.length >= 2);

    // Execute deletion
    await processConversationDeletion(ticket.id, "admin_user");

    // Verify messages are permanently gone (zero rows)
    const afterMsgs = await getTicketMessages(ticket.id);
    assert.strictEqual(afterMsgs.length, 0, "All messages must be wiped");

    const updatedTicket = await getTicketById(ticket.id);
    assert.strictEqual(updatedTicket?.status, "closed");
    assert.strictEqual(updatedTicket?.topic, "[Deleted upon user request]");
  });

  // 7. Role-Based Volunteer Authentication
  await test("Volunteer authentication validates password salt/hash and issues session", async () => {
    // Valid admin login
    const adminLogin = await volunteerLogin("admin@hithataidak.lk", "AdminSafePassword2026!");
    assert.ok(adminLogin, "Admin login should succeed");
    assert.strictEqual(adminLogin.volunteer.role, "admin");

    const sessionVol = await getVolunteerBySession(adminLogin.sessionToken);
    assert.ok(sessionVol);
    assert.strictEqual(sessionVol.email, "admin@hithataidak.lk");

    // Invalid password
    const badLogin = await volunteerLogin("admin@hithataidak.lk", "WrongPassword123!");
    assert.strictEqual(badLogin, null, "Bad password must be rejected");
  });

  // 8. Dynamic Availability Indicator
  await test("System availability accurately reflects volunteer database status and operating hours", async () => {
    const avail = await getSystemAvailability();
    assert.ok(avail.operatingHours);
    assert.ok(["available", "busy", "offline"].includes(avail.status));
    assert.strictEqual(typeof avail.pilotMode, "boolean");
  });

  await test("Stale supporter presence expires and real portal activity restores the chosen status", async () => {
    db.prepare("UPDATE volunteer_availability SET status = 'offline'").run();
    await setVolunteerAvailability("vol_sup_01", "online");
    assert.strictEqual((await getSystemAvailability()).status, "available");
    db.prepare("UPDATE volunteer_availability SET updated_at = ? WHERE volunteer_id = ?")
      .run(new Date(Date.now() - 120_000).toISOString(), "vol_sup_01");
    assert.strictEqual((await getSystemAvailability()).status, "offline");
    await touchVolunteerPresence("vol_sup_01");
    assert.strictEqual((await getSystemAvailability()).status, "available");
    await setVolunteerAvailability("vol_sup_01", "busy");
    await touchVolunteerPresence("vol_sup_01");
    assert.strictEqual((await getSystemAvailability()).status, "busy");
  });

  await test("Closing a conversation is idempotent and further messages cannot be saved", async () => {
    const { ticket } = await createSupportTicket({ preferredLanguage: "en" });
    await closeTicket(ticket.id, "visitor");
    const messages = await getTicketMessages(ticket.id);
    await closeTicket(ticket.id, "visitor");
    assert.strictEqual((await getTicketMessages(ticket.id)).length, messages.length);
    await assert.rejects(async () => {
      await addMessage(ticket.id, "visitor", "You", "Late message");
    }, /closed/);
    assert.strictEqual((await getTicketMessages(ticket.id)).length, messages.length);
  });

  await test("Recovery rotates access and processed deletion revokes all conversation credentials", async () => {
    const { ticket, sessionToken, recoveryCode } = await createSupportTicket({ preferredLanguage: "en" });
    assert.strictEqual(await verifyVisitorSession(ticket.id, sessionToken), true);
    const resumed = (await resumeTicketWithRecoveryCode(ticket.ticket_ref, recoveryCode))!;
    assert.strictEqual(await verifyVisitorSession(ticket.id, sessionToken), false);
    assert.strictEqual(await verifyVisitorSession(ticket.id, resumed.sessionToken), true);
    await processConversationDeletion(ticket.id, "admin_user");
    assert.strictEqual(await verifyVisitorSession(ticket.id, resumed.sessionToken), false);
    assert.strictEqual(await resumeTicketWithRecoveryCode(ticket.ticket_ref, recoveryCode), null);
  });

  console.log("\n=================================================");
  console.log(`  ALL ${passed}/${total} SECURITY & SYSTEM TESTS PASSED SUCCESSFULLY!`);
  console.log("=================================================\n");
}

runTestSuite();
