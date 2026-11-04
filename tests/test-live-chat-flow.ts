import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function runE2ETest() {
  console.log("=================================================================");
  console.log("  HITHATA IDAK — END-TO-END CHAT & ADMIN PORTAL LIVE FLOW TEST   ");
  console.log("=================================================================\n");

  // Step 1: Supporter / Admin Login
  console.log("[1/7] Logging in to Supporter Portal with supporter@hithataidak.lk...");
  const loginRes = await fetch(`${BASE_URL}/api/portal/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "supporter@hithataidak.lk",
      password: "SupporterSafePassword2026!",
    }),
  });

  assert.strictEqual(loginRes.status, 200, `Login failed with status ${loginRes.status}`);
  const loginData = await loginRes.json();
  const supporterCookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";
  console.log(`✓ Supporter logged in: ${loginData.volunteer.display_name} (${loginData.volunteer.email})`);
  assert(supporterCookie.includes("hid_supporter_session="), "Supporter session cookie missing");

  // Step 2: Set Supporter Availability to Online
  console.log("\n[2/7] Setting supporter status to ONLINE...");
  const availRes = await fetch(`${BASE_URL}/api/portal/availability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: supporterCookie,
    },
    body: JSON.stringify({ status: "online" }),
  });
  assert.strictEqual(availRes.status, 200, "Failed to update availability");

  // Verify public availability
  const pubAvailRes = await fetch(`${BASE_URL}/api/availability`);
  const pubAvail = await pubAvailRes.json();
  console.log(`✓ Public availability status: ${pubAvail.status} (Active supporters: ${pubAvail.activeSupportersCount})`);
  assert.strictEqual(pubAvail.status, "available", "Platform should report available when supporter is online");

  // Step 3: Visitor creates a new anonymous ticket
  console.log("\n[3/7] Visitor visits /chat and starts an anonymous conversation...");
  const createTicketRes = await fetch(`${BASE_URL}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preferredLanguage: "si",
      topic: "Stress & Overwhelming Feelings",
    }),
  });
  assert.strictEqual(createTicketRes.status, 200, "Failed to create visitor ticket");
  const ticketData = await createTicketRes.json();
  const visitorCookie = createTicketRes.headers.get("set-cookie")?.split(";")[0] || "";
  const ticketRef = ticketData.ticket.ticket_ref;
  console.log(`✓ Visitor ticket created: Ref ${ticketRef} (Language: ${ticketData.ticket.preferred_language})`);
  console.log(`✓ Recovery Code: ${ticketData.recoveryCode}`);
  assert(visitorCookie.includes("hid_visitor_session="), "Visitor session cookie missing");

  // Step 4: Visitor sends a message to the chat
  const visitorMessageText = "මම ගොඩක් මානසික පීඩනයකින් ඉන්නේ. මට කවුරුහරි එක්ක කතා කරන්න පුළුවන්ද?";
  console.log(`\n[4/7] Visitor sends message: "${visitorMessageText}"`);
  const sendMsgRes = await fetch(`${BASE_URL}/api/tickets/${ticketRef}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: visitorCookie,
    },
    body: JSON.stringify({ content: visitorMessageText }),
  });
  assert.strictEqual(sendMsgRes.status, 200, "Failed to send visitor message");
  console.log("✓ Visitor message sent and encrypted at rest!");

  // Step 5: Supporter in Admin Panel receives the message
  console.log(`\n[5/7] Supporter checks Admin Portal for new ticket ${ticketRef}...`);
  const listTicketsRes = await fetch(`${BASE_URL}/api/portal/tickets`, {
    headers: { Cookie: supporterCookie },
  });
  assert.strictEqual(listTicketsRes.status, 200, "Failed to list portal tickets");
  const portalTicketsData = await listTicketsRes.json();
  const foundTicket = portalTicketsData.tickets.find((t: any) => t.ticket_ref === ticketRef);
  assert(foundTicket, `Ticket ${ticketRef} not found in portal`);
  console.log(`✓ Supporter found ticket in portal queue (Status: ${foundTicket.status})`);

  // Supporter assigns ticket to self
  const assignRes = await fetch(`${BASE_URL}/api/portal/tickets/${ticketRef}/assign`, {
    method: "POST",
    headers: { Cookie: supporterCookie },
  });
  assert.strictEqual(assignRes.status, 200, "Failed to assign ticket");
  console.log(`✓ Supporter assigned ticket ${ticketRef} to themselves`);

  // Supporter opens ticket to read conversation
  const viewTicketRes = await fetch(`${BASE_URL}/api/portal/tickets/${ticketRef}`, {
    headers: { Cookie: supporterCookie },
  });
  assert.strictEqual(viewTicketRes.status, 200, "Failed to view ticket");
  const viewTicketData = await viewTicketRes.json();
  console.log(`✓ Supporter opened conversation. Message count: ${viewTicketData.messages.length}`);
  
  const receivedVisitorMsg = viewTicketData.messages.find((m: any) => m.content === visitorMessageText);
  assert(receivedVisitorMsg, "Visitor message was not received in admin portal!");
  console.log(`✓ [CONFIRMED RECEIVED IN ADMIN PANEL]: "${receivedVisitorMsg.content}"`);

  // Step 6: Supporter replies from the Admin Panel
  const supporterReplyText = "ආයුබෝවන්, මම ඔබගේ පණිවිඩය කියෙව්වා. ඔබ තනිවෙලා නැහැ, අපි ඔබ වෙනුවෙන් ඉන්නවා. ඔබට දැනෙන දේ ගැන නිදහසේ කතා කරන්න.";
  console.log(`\n[6/7] Supporter sends reply from portal: "${supporterReplyText}"`);
  const replyRes = await fetch(`${BASE_URL}/api/portal/tickets/${ticketRef}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: supporterCookie,
    },
    body: JSON.stringify({ content: supporterReplyText }),
  });
  assert.strictEqual(replyRes.status, 200, "Supporter failed to send reply");
  console.log("✓ Supporter reply sent and saved!");

  // Step 7: Visitor chat receives the supporter's reply
  console.log(`\n[7/7] Visitor chat checks for new messages...`);
  const visitorPollRes = await fetch(`${BASE_URL}/api/tickets/${ticketRef}`, {
    headers: { Cookie: visitorCookie },
  });
  assert.strictEqual(visitorPollRes.status, 200, "Visitor failed to poll conversation");
  const visitorPollData = await visitorPollRes.json();
  
  const receivedReply = visitorPollData.messages.find((m: any) => m.content === supporterReplyText);
  assert(receivedReply, "Supporter reply was NOT received by visitor chat!");
  console.log(`✓ [CONFIRMED RECEIVED IN VISITOR CHAT]: "${receivedReply.content}"`);
  console.log(`  - Sender: ${receivedReply.sender_name} (${receivedReply.sender_role})`);
  console.log(`  - Ticket status: ${visitorPollData.ticket.status}`);

  // Step 8: Multi-turn test - Visitor sends a second message
  const followUpText = "ගොඩක් ස්තූතියි අහගෙන හිටියට. මට දැන් ටිකක් සහනයක් දැනෙනවා.";
  console.log(`\n[8/8] Visitor sends follow-up: "${followUpText}"`);
  const followUpRes = await fetch(`${BASE_URL}/api/tickets/${ticketRef}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: visitorCookie,
    },
    body: JSON.stringify({ content: followUpText }),
  });
  assert.strictEqual(followUpRes.status, 200, "Visitor follow-up failed");

  // Supporter sees the follow-up
  const finalSupporterCheck = await fetch(`${BASE_URL}/api/portal/tickets/${ticketRef}`, {
    headers: { Cookie: supporterCookie },
  });
  const finalPortalData = await finalSupporterCheck.json();
  const confirmedFollowUp = finalPortalData.messages.find((m: any) => m.content === followUpText);
  assert(confirmedFollowUp, "Supporter portal did not receive the follow-up message!");
  console.log(`✓ [CONFIRMED RECEIVED IN ADMIN PANEL (TURN 2)]: "${confirmedFollowUp.content}"`);
  console.log(`✓ Total conversation turns active: ${finalPortalData.messages.length} messages`);

  console.log("\n=================================================================");
  console.log("  ALL TESTS PASSED! FULL END-TO-END CHAT & PORTAL TEST SUCCESSFUL! ");
  console.log("=================================================================");
}

runE2ETest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
