import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import {
  getAdminSession,
  recordAuditLog,
  setAdminSessionCookie,
  verifySecret,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";

const loginSchema = z.object({
  username: z.string().trim().min(2).max(64),
  password: z.string().min(6).max(128),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({ authenticated: true, user: session });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan masuk. Coba kembali dalam ${limit.retryAfterSec} detik.`,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nama pengguna dan kata sandi wajib diisi dengan benar." },
      { status: 400 }
    );
  }

  const db = getDb();
  const user = db
    .prepare(
      `SELECT id, username, display_name, role, password_hash FROM admin_users WHERE username = ?`
    )
    .get(parsed.data.username) as
    | {
        id: string;
        username: string;
        display_name: string;
        role: string;
        password_hash: string;
      }
    | undefined;

  if (!user || !verifySecret(parsed.data.password, user.password_hash)) {
    return NextResponse.json(
      { error: "Kredensial tidak valid." },
      { status: 401 }
    );
  }

  db.prepare(`UPDATE admin_users SET last_login_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    user.id
  );

  await setAdminSessionCookie({
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
  });

  recordAuditLog(user.username, "LOGIN", "ADMIN_USER", user.id);

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    },
  });
}
