import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { listAdminAuditEvents } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const auditEvents = listAdminAuditEvents(60);
    return NextResponse.json({ auditEvents });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  }
}
