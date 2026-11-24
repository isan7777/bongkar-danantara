import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db/client";

const SESSION_COOKIE_NAME = "bd_editorial_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

declare global {
  var __bongkarEphemeralSecret: string | undefined;
}

function getSessionSecret(): string {
  if (process.env.BONGKAR_SESSION_SECRET) {
    return process.env.BONGKAR_SESSION_SECRET;
  }
  if (!global.__bongkarEphemeralSecret) {
    global.__bongkarEphemeralSecret = crypto.randomBytes(32).toString("hex");
  }
  return global.__bongkarEphemeralSecret;
}

export function hashSecret(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifySecret(plain: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(plain, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export interface AdminSession {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  exp: number;
}

export function signSessionToken(payload: Omit<AdminSession, "exp">): string {
  const fullPayload: AdminSession = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): AdminSession | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSession;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setAdminSessionCookie(
  payload: Omit<AdminSession, "exp">
): Promise<void> {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function recordAuditLog(
  actorUsername: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (id, actor_username, action, target_type, target_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `AUD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    actorUsername,
    action,
    targetType,
    targetId,
    details ?? null,
    new Date().toISOString()
  );
}
