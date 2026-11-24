import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { listRightOfReplies } from "@/lib/db/queries";
import { getAdminSession, recordAuditLog } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";

const createReplySchema = z.object({
  respondent_name: z.string().trim().min(3).max(160),
  respondent_role: z.string().trim().min(3).max(160),
  related_article_slug: z.string().trim().max(160).optional().nullable(),
  topic: z.string().trim().min(8).max(240),
  editorial_claim_summary: z.string().trim().min(10).max(1000),
  official_response_text: z.string().trim().min(20).max(5000),
  editorial_verification_note: z.string().trim().max(2000).optional(),
  source_url: z.string().trim().url().optional().nullable().or(z.literal("")),
});

const moderateReplySchema = z.object({
  id: z.string().trim().min(3),
  status: z.enum(["DIPUBLIKASIKAN", "MENUNGGU_MODERASI"]),
  editorial_verification_note: z.string().trim().min(10).max(2000),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includePendingParam = searchParams.get("includePending") === "1";
  let includePending = false;
  if (includePendingParam) {
    const session = await getAdminSession();
    if (session) includePending = true;
  }
  const replies = listRightOfReplies(includePending);
  return NextResponse.json({ replies, total: replies.length });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`reply:${ip}`, 6, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak pengiriman hak jawab. Coba beberapa saat lagi." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid." }, { status: 400 });
  }

  const parsed = createReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validasi formulir hak jawab gagal.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await getAdminSession();
  const status = session ? "DIPUBLIKASIKAN" : "MENUNGGU_MODERASI";
  const id = `ROR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const today = new Date().toISOString().slice(0, 10);
  const data = parsed.data;

  const db = getDb();
  db.prepare(
    `INSERT INTO right_of_replies (
      id, respondent_name, respondent_role, response_date, related_article_slug,
      topic, editorial_claim_summary, official_response_text,
      editorial_verification_note, source_url, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.respondent_name,
    data.respondent_role,
    today,
    data.related_article_slug || null,
    data.topic,
    data.editorial_claim_summary,
    data.official_response_text,
    data.editorial_verification_note ||
      "Tanggapan diterima melalui kanal Hak Jawab dan sedang diverifikasi keaslian identitas penanggap oleh redaksi.",
    data.source_url || null,
    status,
    new Date().toISOString()
  );

  if (session) {
    recordAuditLog(session.username, "CREATE_REPLY", "RIGHT_OF_REPLY", id, data.topic);
  }

  return NextResponse.json({ id, status }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid." }, { status: 400 });
  }

  const parsed = moderateReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const db = getDb();
  const res = db
    .prepare(
      `UPDATE right_of_replies
       SET status = ?, editorial_verification_note = ?
       WHERE id = ?`
    )
    .run(
      parsed.data.status,
      parsed.data.editorial_verification_note,
      parsed.data.id
    );

  if (res.changes === 0) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }

  recordAuditLog(
    session.username,
    "MODERATE_REPLY",
    "RIGHT_OF_REPLY",
    parsed.data.id,
    parsed.data.status
  );
  return NextResponse.json({ ok: true });
}
