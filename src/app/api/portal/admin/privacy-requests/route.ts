import { NextResponse } from "next/server";
import { authenticateSupporter } from "@/lib/api-auth";
import { listPrivacyRequests } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const supporter = await authenticateSupporter(req);
    if (!supporter || (supporter.role !== "admin" && supporter.role !== "supervisor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const requests = listPrivacyRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("List privacy requests error:", error);
    return NextResponse.json({ error: "Failed to list requests" }, { status: 500 });
  }
}
