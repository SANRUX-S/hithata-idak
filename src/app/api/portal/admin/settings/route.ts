import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { getPlatformSetting, updatePlatformSetting, logAdminAudit } from "@/lib/store";
import { z } from "zod";

const settingsSchema = z.object({
  serviceStatus: z.enum(["online", "offline"]).optional(),
  pilotMode: z.enum(["true", "false"]).optional(),
  operatingHours: z.string().trim().min(1).max(100).optional(),
  retentionDays: z.string().regex(/^\d{1,3}$/).refine((value) => Number(value) >= 1 && Number(value) <= 365, "Retention policy must be between 1 and 365 days").optional(),
});

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [serviceStatus, pilotMode, operatingHours, retentionDays] = await Promise.all([
      getPlatformSetting("service_status"),
      getPlatformSetting("pilot_mode"),
      getPlatformSetting("operating_hours"),
      getPlatformSetting("retention_days"),
    ]);

    return NextResponse.json({
      serviceStatus: serviceStatus || "online",
      pilotMode: pilotMode || "true",
      operatingHours: operatingHours || "8:00 AM - 10:00 PM IST (Sri Lanka Time)",
      retentionDays: retentionDays || "30",
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

    if (parsed.data.serviceStatus) await updatePlatformSetting("service_status", parsed.data.serviceStatus);
    if (parsed.data.pilotMode) await updatePlatformSetting("pilot_mode", parsed.data.pilotMode);
    if (parsed.data.operatingHours) await updatePlatformSetting("operating_hours", parsed.data.operatingHours);
    if (parsed.data.retentionDays) await updatePlatformSetting("retention_days", parsed.data.retentionDays);

    await logAdminAudit(supporter.id, "UPDATE_SETTINGS", "platform_settings", "global", JSON.stringify(parsed.data));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update platform settings" }, { status: 500 });
  }
}
