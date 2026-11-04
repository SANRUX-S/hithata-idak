import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { hashPassword } from "./crypto";

// Singleton connection across Next.js reloads
declare global {
  var __hithata_db: DatabaseSync | undefined;
}

export function getDatabase(): DatabaseSync {
  if (global.__hithata_db) {
    return global.__hithata_db;
  }
  const isServerless = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
  const defaultPath = isServerless ? "/tmp/hithata_idak.db" : path.join(process.cwd(), ".data", "hithata_idak.db");
  const dbPath = process.env.DATABASE_PATH || defaultPath;
  if (dbPath !== ":memory:") {
    try {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    } catch {
      // Ignore if directory already exists or read-only parent
    }
  }
  const dbInstance = new DatabaseSync(dbPath);
  try {
    dbInstance.exec("PRAGMA busy_timeout = 30000;");
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    // Serialize initialization across workers. Never cache a partially initialized connection.
    dbInstance.exec("BEGIN IMMEDIATE;");
    initSchema(dbInstance);
    seedInitialData(dbInstance);
    dbInstance.exec("COMMIT;");
  } catch (error) {
    try { dbInstance.exec("ROLLBACK;"); } catch { /* No transaction may be open. */ }
    dbInstance.close();
    throw error;
  }
  global.__hithata_db = dbInstance;
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    -- Platform Settings
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Volunteers and Administrators
    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'supporter')),
      is_active INTEGER NOT NULL DEFAULT 1,
      is_approved INTEGER NOT NULL DEFAULT 1,
      mfa_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Volunteer Auth Sessions
    CREATE TABLE IF NOT EXISTS volunteer_sessions (
      token TEXT PRIMARY KEY,
      volunteer_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    );

    -- Volunteer Real-time Availability
    CREATE TABLE IF NOT EXISTS volunteer_availability (
      volunteer_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('online', 'busy', 'offline')),
      updated_at TEXT NOT NULL,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    );

    -- Support Tickets
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_ref TEXT UNIQUE NOT NULL,
      preferred_language TEXT NOT NULL CHECK(preferred_language IN ('si', 'en')),
      topic TEXT,
      status TEXT NOT NULL CHECK(status IN ('waiting', 'assigned', 'active', 'awaiting_reply', 'closed')),
      assigned_volunteer_id TEXT,
      is_priority_review INTEGER NOT NULL DEFAULT 0,
      is_safety_flagged INTEGER NOT NULL DEFAULT 0,
      safety_notes TEXT,
      feedback_rating INTEGER,
      feedback_text TEXT,
      deletion_requested INTEGER NOT NULL DEFAULT 0,
      deletion_requested_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      closed_at TEXT,
      FOREIGN KEY(assigned_volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_ref ON support_tickets(ticket_ref);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_volunteer ON support_tickets(assigned_volunteer_id);

    -- Ticket Private Access Credentials
    CREATE TABLE IF NOT EXISTS ticket_access_credentials (
      ticket_id TEXT PRIMARY KEY,
      hashed_recovery_verifier TEXT NOT NULL,
      salt TEXT NOT NULL,
      session_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_creds_session ON ticket_access_credentials(session_token);

    -- Encrypted Conversation Messages (Zero plaintext stored at rest)
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('visitor', 'supporter', 'system')),
      sender_name TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_ticket ON conversation_messages(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_messages_time ON conversation_messages(created_at);

    -- Ticket Assignment History
    CREATE TABLE IF NOT EXISTS ticket_assignments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      volunteer_id TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      assigned_at TEXT NOT NULL,
      unassigned_at TEXT,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    );

    -- Privacy & Deletion Requests
    CREATE TABLE IF NOT EXISTS privacy_requests (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      ticket_ref TEXT NOT NULL,
      request_type TEXT NOT NULL CHECK(request_type IN ('delete_conversation', 'export_data', 'general_privacy')),
      status TEXT NOT NULL CHECK(status IN ('pending', 'processed', 'rejected')),
      processed_by TEXT,
      processed_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Safety & Incident Reports
    CREATE TABLE IF NOT EXISTS incident_reports (
      id TEXT PRIMARY KEY,
      report_type TEXT NOT NULL CHECK(report_type IN ('supporter_behavior', 'privacy_concern', 'harassment', 'platform_misuse', 'technical_issue')),
      ticket_ref TEXT,
      description TEXT NOT NULL,
      contact_email TEXT,
      status TEXT NOT NULL CHECK(status IN ('open', 'under_review', 'resolved')),
      resolution_notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Volunteer Applications (Expression of Interest)
    CREATE TABLE IF NOT EXISTS volunteer_applications (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      languages TEXT NOT NULL,
      motivation TEXT NOT NULL,
      background TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'interview_scheduled', 'training', 'approved', 'rejected')),
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- General Feedback & Comments
    CREATE TABLE IF NOT EXISTS user_feedback (
      id TEXT PRIMARY KEY,
      feedback_type TEXT NOT NULL,
      rating INTEGER,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Administrative Audit Events (Message text is strictly forbidden here)
    CREATE TABLE IF NOT EXISTS admin_audit_events (
      id TEXT PRIMARY KEY,
      volunteer_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details_safe TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function seedInitialData(db: DatabaseSync) {
  const now = new Date().toISOString();

  // 1. Initial Platform Settings
  {
    const settingsCountRow = db.prepare("SELECT COUNT(*) as count FROM platform_settings").get() as { count: number } | undefined;
    if (!settingsCountRow || settingsCountRow.count === 0) {
      const insertSetting = db.prepare("INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)");
      insertSetting.run("service_status", "online", now);
      insertSetting.run("pilot_mode", "true", now);
      insertSetting.run("operating_hours", "8:00 AM - 10:00 PM IST (Sri Lanka Time)", now);
      insertSetting.run("retention_days", "30", now);
      insertSetting.run("max_active_tickets_per_supporter", "3", now);
    }
  }

  // 2. Initial Seed Volunteers & Administrators
  {
    const volunteerCountRow = db.prepare("SELECT COUNT(*) as count FROM volunteers").get() as { count: number } | undefined;
    if (!volunteerCountRow || volunteerCountRow.count === 0) {
      const insertVol = db.prepare(`
        INSERT INTO volunteers (id, email, display_name, password_hash, password_salt, role, is_active, is_approved, mfa_enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertAvail = db.prepare("INSERT INTO volunteer_availability (volunteer_id, status, updated_at) VALUES (?, ?, ?)");

      // Administrator
      const adminPass = hashPassword("AdminSafePassword2026!");
      insertVol.run(
        "vol_admin_01",
        "admin@hithataidak.lk",
        "Platform Administrator",
        adminPass.hash,
        adminPass.salt,
        "admin",
        1,
        1,
        0,
        now,
        now
      );
      insertAvail.run("vol_admin_01", "offline", now);

      // Duty Supporter
      const supPass1 = hashPassword("SupporterSafePassword2026!");
      insertVol.run(
        "vol_sup_01",
        "supporter@hithataidak.lk",
        "Duty Supporter",
        supPass1.hash,
        supPass1.salt,
        "supporter",
        1,
        1,
        0,
        now,
        now
      );
      insertAvail.run("vol_sup_01", "offline", now);

      // Duty Supervisor
      const supPass2 = hashPassword("SupervisorSafePassword2026!");
      insertVol.run(
        "vol_sup_02",
        "supervisor@hithataidak.lk",
        "Duty Supervisor",
        supPass2.hash,
        supPass2.salt,
        "supervisor",
        1,
        1,
        0,
        now,
        now
      );
      insertAvail.run("vol_sup_02", "offline", now);
    }
  }
}

export function withDatabaseTransaction<T>(work: () => T): T {
  const connection = getDatabase();
  connection.exec("BEGIN IMMEDIATE;");
  try {
    const result = work();
    connection.exec("COMMIT;");
    return result;
  } catch (error) {
    connection.exec("ROLLBACK;");
    throw error;
  }
}

// Export lazy DB proxy
export const db = {
  prepare: (sql: string) => getDatabase().prepare(sql),
  exec: (sql: string) => getDatabase().exec(sql),
};
