import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { hashPassword } from "./crypto";

// Singleton connections across Next.js reloads
declare global {
  var __hithata_sqlite_db: DatabaseSync | undefined;
  var __hithata_neon_sql: NeonQueryFunction<false, false> | undefined;
  var __hithata_neon_init_done: boolean | undefined;
}

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export function isUsingNeon(): boolean {
  return Boolean(getDatabaseUrl());
}

// ----------------------------------------------------
// SQLITE ADAPTER (Local testing, npm test, offline dev)
// ----------------------------------------------------
export function getSqliteDatabase(): DatabaseSync {
  if (global.__hithata_sqlite_db) {
    return global.__hithata_sqlite_db;
  }
  const isServerless = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
  const defaultPath = isServerless ? "/tmp/hithata_idak.db" : path.join(process.cwd(), ".data", "hithata_idak.db");
  const dbPath = process.env.DATABASE_PATH || defaultPath;
  if (dbPath !== ":memory:") {
    try {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    } catch {
      // Ignore if directory exists
    }
  }
  const dbInstance = new DatabaseSync(dbPath);
  try {
    dbInstance.exec("PRAGMA busy_timeout = 30000;");
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    dbInstance.exec("BEGIN IMMEDIATE;");
    initSqliteSchema(dbInstance);
    seedSqliteInitialData(dbInstance);
    dbInstance.exec("COMMIT;");
  } catch (error) {
    try { dbInstance.exec("ROLLBACK;"); } catch { /* No active txn */ }
    dbInstance.close();
    throw error;
  }
  global.__hithata_sqlite_db = dbInstance;
  return dbInstance;
}

function initSqliteSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS volunteer_sessions (
      token TEXT PRIMARY KEY,
      volunteer_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS volunteer_availability (
      volunteer_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('online', 'busy', 'offline')),
      updated_at TEXT NOT NULL,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS ticket_access_credentials (
      ticket_id TEXT PRIMARY KEY,
      hashed_recovery_verifier TEXT NOT NULL,
      salt TEXT NOT NULL,
      session_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_creds_session ON ticket_access_credentials(session_token);

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

    CREATE TABLE IF NOT EXISTS user_feedback (
      id TEXT PRIMARY KEY,
      feedback_type TEXT NOT NULL,
      rating INTEGER,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_audit_events (
      id TEXT PRIMARY KEY,
      volunteer_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details_safe TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_alias TEXT NOT NULL,
      category TEXT NOT NULL,
      reactions_warmth INTEGER NOT NULL DEFAULT 0,
      reactions_alone INTEGER NOT NULL DEFAULT 0,
      reactions_insight INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_flagged INTEGER NOT NULL DEFAULT 0,
      flag_reason TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_alias TEXT NOT NULL,
      is_supporter INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      is_flagged INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    );
  `);
}

function seedSqliteInitialData(db: DatabaseSync) {
  const now = new Date().toISOString();
  const settingsCountRow = db.prepare("SELECT COUNT(*) as count FROM platform_settings").get() as { count: number } | undefined;
  if (!settingsCountRow || settingsCountRow.count === 0) {
    const insertSetting = db.prepare("INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)");
    insertSetting.run("service_status", "online", now);
    insertSetting.run("pilot_mode", "true", now);
    insertSetting.run("operating_hours", "8:00 AM - 10:00 PM IST (Sri Lanka Time)", now);
    insertSetting.run("retention_days", "30", now);
    insertSetting.run("max_active_tickets_per_supporter", "3", now);
  }

  const volunteerCountRow = db.prepare("SELECT COUNT(*) as count FROM volunteers").get() as { count: number } | undefined;
  if (!volunteerCountRow || volunteerCountRow.count === 0) {
    const insertVol = db.prepare(`
      INSERT INTO volunteers (id, email, display_name, password_hash, password_salt, role, is_active, is_approved, mfa_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAvail = db.prepare("INSERT INTO volunteer_availability (volunteer_id, status, updated_at) VALUES (?, ?, ?)");

    const adminPass = hashPassword("AdminSafePassword2026!");
    insertVol.run("vol_admin_01", "admin@hithataidak.lk", "Platform Administrator", adminPass.hash, adminPass.salt, "admin", 1, 1, 0, now, now);
    insertAvail.run("vol_admin_01", "offline", now);

    const supPass1 = hashPassword("SupporterSafePassword2026!");
    insertVol.run("vol_sup_01", "supporter@hithataidak.lk", "Duty Supporter", supPass1.hash, supPass1.salt, "supporter", 1, 1, 0, now, now);
    insertAvail.run("vol_sup_01", "offline", now);

    const supPass2 = hashPassword("SupervisorSafePassword2026!");
    insertVol.run("vol_sup_02", "supervisor@hithataidak.lk", "Duty Supervisor", supPass2.hash, supPass2.salt, "supervisor", 1, 1, 0, now, now);
    insertAvail.run("vol_sup_02", "offline", now);
  }

  const postCountRow = db.prepare("SELECT COUNT(*) as count FROM community_posts").get() as { count: number } | undefined;
  if (!postCountRow || postCountRow.count === 0) {
    const insertPost = db.prepare(`
      INSERT INTO community_posts (id, title, content, author_alias, category, reactions_warmth, reactions_alone, reactions_insight, is_pinned, is_flagged, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertReply = db.prepare(`
      INSERT INTO community_replies (id, post_id, author_alias, is_supporter, content, is_flagged, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPost.run(
      "post_seed_01",
      "විභාග සහ අනාගතය ගැන දැනෙන දැඩි බය (Exam Stress & Fear of Failure)",
      "මම මේ දවස්වල A/L විභාගයට ලෑස්ති වෙන ගමන් ඉන්නේ. මට හිතෙනවා මට මේක කරගන්න බැරි වෙයි කියලා. ගෙදර අයගේ බලාපොරොත්තු වැඩියි. සමහර දවස්වලට කිසිම දෙයක් කරගන්න හිතෙන්නේ නෑ. මට වගේම තවත් අයට මෙහෙම දැනිලා තියෙනවද?",
      "Anonymous Learner",
      "academic",
      12, 18, 5, 1, 0, "active", now, now
    );
    insertReply.run(
      "reply_seed_01",
      "post_seed_01",
      "කරුණාවන්ත හිතවතෙක්",
      0,
      "ඔබ තනිවෙලා නෑ යාළුවේ. මාත් A/L කරද්දී මේ විදිහටම බය වුණා. එක මොහොතකදී එක දවසක් ගැන විතරක් හිතන්න. ඔබේ ජීවිතය විභාගයකට වඩා ගොඩක් වටිනවා.",
      0, "active", now
    );
    insertReply.run(
      "reply_seed_02",
      "post_seed_01",
      "Duty Supporter",
      1,
      "දවසට විනාඩි 10ක් හුස්ම ගැනීමේ අභ්‍යාස කරන්න, මඳක් ඇවිදින්න යන්න. ඔබට කතා කරන්න අවශ්‍ය නම් මේ site එකේ Let's Talk වෙතින් අපට පණිවිඩයක් එවන්න.",
      0, "active", now
    );

    insertPost.run(
      "post_seed_02",
      "අද මම ලැබූ පුංචි ජයග්‍රහණයක් (A Small Victory Today)",
      "පහුගිය දවස් 3ම මම කාමරයෙන් එළියට ආවෙත් නෑ. හැබැයි අද උදේ මම නැගිටලා මූණ හෝදලා, උණු තේ එකක් බිව්වා. ඒක පුංචි දෙයක් වුණත් මට අද ලොකු සහනයක් දැනෙනවා. හැමෝටම සුවදායක දවසක් වේවා!",
      "Hope Seeker",
      "hope",
      24, 7, 9, 0, 0, "active", now, now
    );
    insertReply.run(
      "reply_seed_03",
      "post_seed_02",
      "Kind Soul",
      0,
      "ඒක කොහෙත්ම පුංචි දෙයක් නෙවෙයි! පියවරෙන් පියවර සෙමින් ඉදිරියට යන්න. අපි ඔබ ගැන ගොඩක් ආඩම්බර වෙනවා ❤️",
      0, "active", now
    );
  }
}

// ----------------------------------------------------
// NEON POSTGRESQL ADAPTER (Production / Vercel Serverless)
// ----------------------------------------------------
export function getNeonSql(): NeonQueryFunction<false, false> {
  if (global.__hithata_neon_sql) {
    return global.__hithata_neon_sql;
  }
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error("Neon database URL is not configured in environment variables (DATABASE_URL)");
  }
  const sqlInstance = neon(dbUrl);
  global.__hithata_neon_sql = sqlInstance;
  return sqlInstance;
}

export async function ensureNeonSchema(): Promise<void> {
  if (global.__hithata_neon_init_done) return;
  const sql = getNeonSql();

  const tables = [
    `CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS volunteers (
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
    )`,
    `CREATE TABLE IF NOT EXISTS volunteer_sessions (
      token TEXT PRIMARY KEY,
      volunteer_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS volunteer_availability (
      volunteer_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('online', 'busy', 'offline')),
      updated_at TEXT NOT NULL,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS support_tickets (
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
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_ref ON support_tickets(ticket_ref)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_volunteer ON support_tickets(assigned_volunteer_id)`,
    `CREATE TABLE IF NOT EXISTS ticket_access_credentials (
      ticket_id TEXT PRIMARY KEY,
      hashed_recovery_verifier TEXT NOT NULL,
      salt TEXT NOT NULL,
      session_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_creds_session ON ticket_access_credentials(session_token)`,
    `CREATE TABLE IF NOT EXISTS conversation_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('visitor', 'supporter', 'system')),
      sender_name TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_messages_ticket ON conversation_messages(ticket_id)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_time ON conversation_messages(created_at)`,
    `CREATE TABLE IF NOT EXISTS ticket_assignments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      volunteer_id TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      assigned_at TEXT NOT NULL,
      unassigned_at TEXT,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS privacy_requests (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      ticket_ref TEXT NOT NULL,
      request_type TEXT NOT NULL CHECK(request_type IN ('delete_conversation', 'export_data', 'general_privacy')),
      status TEXT NOT NULL CHECK(status IN ('pending', 'processed', 'rejected')),
      processed_by TEXT,
      processed_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS incident_reports (
      id TEXT PRIMARY KEY,
      report_type TEXT NOT NULL CHECK(report_type IN ('supporter_behavior', 'privacy_concern', 'harassment', 'platform_misuse', 'technical_issue')),
      ticket_ref TEXT,
      description TEXT NOT NULL,
      contact_email TEXT,
      status TEXT NOT NULL CHECK(status IN ('open', 'under_review', 'resolved')),
      resolution_notes TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS volunteer_applications (
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
    )`,
    `CREATE TABLE IF NOT EXISTS user_feedback (
      id TEXT PRIMARY KEY,
      feedback_type TEXT NOT NULL,
      rating INTEGER,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_audit_events (
      id TEXT PRIMARY KEY,
      volunteer_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details_safe TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_alias TEXT NOT NULL,
      category TEXT NOT NULL,
      reactions_warmth INTEGER NOT NULL DEFAULT 0,
      reactions_alone INTEGER NOT NULL DEFAULT 0,
      reactions_insight INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_flagged INTEGER NOT NULL DEFAULT 0,
      flag_reason TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS community_replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_alias TEXT NOT NULL,
      is_supporter INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      is_flagged INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    )`,
  ];

  for (const tableSql of tables) {
    await sql.query(tableSql);
  }

  // Seed default settings and staff
  const now = new Date().toISOString();
  await sql.query(`
    INSERT INTO platform_settings (key, value, updated_at) VALUES
      ('service_status', 'online', $1),
      ('pilot_mode', 'true', $1),
      ('operating_hours', '8:00 AM - 10:00 PM IST (Sri Lanka Time)', $1),
      ('retention_days', '30', $1),
      ('max_active_tickets_per_supporter', '3', $1)
    ON CONFLICT (key) DO NOTHING
  `, [now]);

  const adminPass = hashPassword("AdminSafePassword2026!");
  const supPass1 = hashPassword("SupporterSafePassword2026!");
  const supPass2 = hashPassword("SupervisorSafePassword2026!");

  await sql.query(`
    INSERT INTO volunteers (id, email, display_name, password_hash, password_salt, role, is_active, is_approved, mfa_enabled, created_at, updated_at)
    VALUES
      ('vol_admin_01', 'admin@hithataidak.lk', 'Platform Administrator', $1, $2, 'admin', 1, 1, 0, $3, $3),
      ('vol_sup_01', 'supporter@hithataidak.lk', 'Duty Supporter', $4, $5, 'supporter', 1, 1, 0, $3, $3),
      ('vol_sup_02', 'supervisor@hithataidak.lk', 'Duty Supervisor', $6, $7, 'supervisor', 1, 1, 0, $3, $3)
    ON CONFLICT (id) DO NOTHING
  `, [adminPass.hash, adminPass.salt, now, supPass1.hash, supPass1.salt, supPass2.hash, supPass2.salt]);

  await sql.query(`
    INSERT INTO volunteer_availability (volunteer_id, status, updated_at)
    VALUES
      ('vol_admin_01', 'offline', $1),
      ('vol_sup_01', 'offline', $1),
      ('vol_sup_02', 'offline', $1)
    ON CONFLICT (volunteer_id) DO NOTHING
  `, [now]);

  // Seed default community posts in Neon
  await sql.query(`
    INSERT INTO community_posts (id, title, content, author_alias, category, reactions_warmth, reactions_alone, reactions_insight, is_pinned, is_flagged, status, created_at, updated_at)
    VALUES
      ('post_seed_01', 'විභාග සහ අනාගතය ගැන දැනෙන දැඩි බය (Exam Stress & Fear of Failure)', 'මම මේ දවස්වල A/L විභාගයට ලෑස්ති වෙන ගමන් ඉන්නේ. මට හිතෙනවා මට මේක කරගන්න බැරි වෙයි කියලා. ගෙදර අයගේ බලාපොරොත්තු වැඩියි. සමහර දවස්වලට කිසිම දෙයක් කරගන්න හිතෙන්නේ නෑ. මට වගේම තවත් අයට මෙහෙම දැනිලා තියෙනවද?', 'Anonymous Learner', 'academic', 12, 18, 5, 1, 0, 'active', $1, $1),
      ('post_seed_02', 'අද මම ලැබූ පුංචි ජයග්‍රහණයක් (A Small Victory Today)', 'පහුගිය දවස් 3ම මම කාමරයෙන් එළියට ආවෙත් නෑ. හැබැයි අද උදේ මම නැගිටලා මූණ හෝදලා, උණු තේ එකක් බිව්වා. ඒක පුංචි දෙයක් වුණත් මට අද ලොකු සහනයක් දැනෙනවා. හැමෝටම සුවදායක දවසක් වේවා!', 'Hope Seeker', 'hope', 24, 7, 9, 0, 0, 'active', $1, $1)
    ON CONFLICT (id) DO NOTHING
  `, [now]);

  await sql.query(`
    INSERT INTO community_replies (id, post_id, author_alias, is_supporter, content, is_flagged, status, created_at)
    VALUES
      ('reply_seed_01', 'post_seed_01', 'කරුණාවන්ත හිතවතෙක්', 0, 'ඔබ තනිවෙලා නෑ යාළුවේ. මාත් A/L කරද්දී මේ විදිහටම බය වුණා. එක මොහොතකදී එක දවසක් ගැන විතරක් හිතන්න. ඔබේ ජීවිතය විභාගයකට වඩා ගොඩක් වටිනවා.', 0, 'active', $1),
      ('reply_seed_02', 'post_seed_01', 'Duty Supporter', 1, 'දවසට විනාඩි 10ක් හුස්ම ගැනීමේ අභ්‍යාස කරන්න, මඳක් ඇවිදින්න යන්න. ඔබට කතා කරන්න අවශ්‍ය නම් මේ site එකේ Let''s Talk වෙතින් අපට පණිවිඩයක් එවන්න.', 0, 'active', $1),
      ('reply_seed_03', 'post_seed_02', 'Kind Soul', 0, 'ඒක කොහෙත්ම පුංචි දෙයක් නෙවෙයි! පියවරෙන් පියවර සෙමින් ඉදිරියට යන්න. අපි ඔබ ගැන ගොඩක් ආඩම්බර වෙනවා ❤️', 0, 'active', $1)
    ON CONFLICT (id) DO NOTHING
  `, [now]);

  global.__hithata_neon_init_done = true;
}

// ----------------------------------------------------
// UNIFIED ASYNC DATABASE ADAPTER
// ----------------------------------------------------
function toPostgresSql(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export const dbAdapter = {
  isNeon(): boolean {
    return isUsingNeon();
  },

  async queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (isUsingNeon()) {
      await ensureNeonSchema();
      const neonSql = getNeonSql();
      const pgSql = toPostgresSql(sql);
      const rows = await neonSql.query(pgSql, params as any[]);
      return rows as unknown as T[];
    } else {
      const sqlite = getSqliteDatabase();
      return sqlite.prepare(sql).all(...(params as any[])) as unknown as T[];
    }
  },

  async queryGet<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    if (isUsingNeon()) {
      await ensureNeonSchema();
      const neonSql = getNeonSql();
      const pgSql = toPostgresSql(sql);
      const rows = await neonSql.query(pgSql, params as any[]);
      return (rows[0] as unknown as T) || null;
    } else {
      const sqlite = getSqliteDatabase();
      const row = sqlite.prepare(sql).get(...(params as any[]));
      return (row as unknown as T) || null;
    }
  },

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    if (isUsingNeon()) {
      await ensureNeonSchema();
      const neonSql = getNeonSql();
      const pgSql = toPostgresSql(sql);
      const result = await neonSql.query(pgSql, params as any[], { fullResults: true });
      return { changes: result.rowCount || 0 };
    } else {
      const sqlite = getSqliteDatabase();
      const result = sqlite.prepare(sql).run(...(params as any[]));
      return { changes: Number(result.changes) };
    }
  },

  async exec(sql: string): Promise<void> {
    if (isUsingNeon()) {
      await ensureNeonSchema();
      const neonSql = getNeonSql();
      await neonSql.query(sql);
    } else {
      const sqlite = getSqliteDatabase();
      sqlite.exec(sql);
    }
  },

  async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (isUsingNeon()) {
      // In serverless HTTP Neon mode, non-interactive transactions can be batched
      // Sequential awaits inside a single lambda function work safely and predictably
      return work();
    } else {
      const connection = getSqliteDatabase();
      connection.exec("BEGIN IMMEDIATE;");
      try {
        const result = await work();
        connection.exec("COMMIT;");
        return result;
      } catch (error) {
        connection.exec("ROLLBACK;");
        throw error;
      }
    }
  },
};

// Backwards-compatible synchronous exports for SQLite tests & fallback
export function getDatabase(): DatabaseSync {
  return getSqliteDatabase();
}

export function withDatabaseTransaction<T>(work: () => T): T {
  const connection = getSqliteDatabase();
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

export const db = {
  prepare: (sql: string) => getSqliteDatabase().prepare(sql),
  exec: (sql: string) => getSqliteDatabase().exec(sql),
};
