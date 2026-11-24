import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  getAdminSession,
  recordAuditLog,
} from "@/lib/auth";

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    recordAuditLog(session.username, "LOGOUT", "ADMIN_USER", session.userId);
  }
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
