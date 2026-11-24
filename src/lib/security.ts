import crypto from "node:crypto";

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "local";
  }
  return request.headers.get("x-real-ip") || "local";
}

export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".csv",
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateUploadMagicBytes(
  buffer: Buffer,
  ext: string
): boolean {
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    return false;
  }
  switch (ext) {
    case ".pdf":
      return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    case ".png":
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    case ".jpg":
    case ".jpeg":
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    case ".txt":
    case ".csv":
      // Reject binary NUL bytes in plain text uploads
      return !buffer.includes(0x00);
    default:
      return false;
  }
}

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const numPart = crypto.randomInt(1000, 9999);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `BD-${year}-${numPart}-${suffix}`;
}

export function generateAccessPin(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 8; i++) {
    pin += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `${pin.slice(0, 4)}-${pin.slice(4)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96);
}
