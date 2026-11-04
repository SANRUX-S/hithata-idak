import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  
  const status = {
    hasDatabaseUrl: Boolean(dbUrl),
    urlPrefix: dbUrl ? dbUrl.substring(0, 15) + "..." : "none",
    host: process.env.PGHOST || "not_set",
    neonConnected: false,
    neonError: null as string | null,
    now: null as string | null,
  };

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const result = await sql`SELECT NOW() as current_time, current_database() as db_name`;
      status.neonConnected = true;
      status.now = String(result[0]?.current_time || "");
    } catch (err: unknown) {
      status.neonError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(status);
}

