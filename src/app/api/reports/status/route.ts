import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { verifySecret } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";

const lookupSchema = z.object({
  tracking_code: z.string().trim().min(6).max(40),
  access_pin: z.string().trim().min(4).max(32),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`report-status:${ip}`, 15, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba kembali dalam ${limit.retryAfterSec} detik.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Kode pelacakan dan PIN akses wajib diisi." },
      { status: 400 }
    );
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT tracking_code, access_pin_hash, category, title, risk_level,
              moderation_status, editor_public_note, attachment_original_name,
              attachment_sha256, created_at, updated_at
       FROM whistleblower_reports
       WHERE tracking_code = ?`
    )
    .get(parsed.data.tracking_code.toUpperCase()) as
    | {
        tracking_code: string;
        access_pin_hash: string;
        category: string;
        title: string;
        risk_level: string;
        moderation_status: string;
        editor_public_note: string | null;
        attachment_original_name: string | null;
        attachment_sha256: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row || !verifySecret(parsed.data.access_pin.toUpperCase(), row.access_pin_hash)) {
    return NextResponse.json(
      { error: "Kode pelacakan atau PIN tidak cocok." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    report: {
      tracking_code: row.tracking_code,
      category: row.category,
      title: row.title,
      risk_level: row.risk_level,
      moderation_status: row.moderation_status,
      editor_public_note: row.editor_public_note,
      attachment_original_name: row.attachment_original_name,
      attachment_sha256: row.attachment_sha256,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });
}
