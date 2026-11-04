import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getPlatformSetting, updatePlatformSetting, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const settingsSchema = z.object({
  serviceStatus: z.enum(["online", "offline"]).optional(),
  pilotMode: z.enum(["true", "false"]).optional(),
  operatingHours: z.string().max(100).optional(),
  retentionDays: z.string().max(10).optional(),
});

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      serviceStatus: getPlatformSetting("service_status") || "online",
      pilotMode: getPlatformSetting("pilot_mode") || "true",
      operatingHours: getPlatformSetting("operating_hours") || "8:00 AM - 10:00 PM IST (Sri Lanka Time)",
      retentionDays: getPlatformSetting("retention_days") || "30",
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || supporter.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin rights required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 });
    }

    if (parsed.data.serviceStatus) updatePlatformSetting("service_status", parsed.data.serviceStatus);
    if (parsed.data.pilotMode) updatePlatformSetting("pilot_mode", parsed.data.pilotMode);
    if (parsed.data.operatingHours) updatePlatformSetting("operating_hours", parsed.data.operatingHours);
    if (parsed.data.retentionDays) updatePlatformSetting("retention_days", parsed.data.retentionDays);

    logAdminAudit(supporter.id, "UPDATE_SETTINGS", "platform_settings", "global", JSON.stringify(parsed.data));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update platform settings" }, { status: 500 });
  }
}
