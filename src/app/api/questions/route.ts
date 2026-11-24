import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { listUnansweredQuestions } from "@/lib/db/queries";
import { getAdminSession, recordAuditLog } from "@/lib/auth";

const createQuestionSchema = z.object({
  question: z.string().trim().min(15).max(600),
  context: z.string().trim().min(10).max(800),
  addressed_to: z.string().trim().min(3).max(200),
  category: z.string().trim().min(3).max(100),
  status: z
    .enum(["BELUM DIJAWAB", "DIJAWAB PARSIAL", "KLARIFIKASI TERCATAT"])
    .default("BELUM DIJAWAB"),
  official_note: z.string().trim().max(800).optional().nullable(),
});

const patchQuestionSchema = z.object({
  id: z.string().trim().min(3),
  status: z.enum(["BELUM DIJAWAB", "DIJAWAB PARSIAL", "KLARIFIKASI TERCATAT"]),
  official_note: z.string().trim().max(800).optional().nullable(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const questions = listUnansweredQuestions(status);
  return NextResponse.json({ questions, total: questions.length });
}

export async function POST(request: Request) {
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

  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data pertanyaan tidak valid.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = getDb();
  const countRow = db
    .prepare(`SELECT COUNT(*) AS c FROM unanswered_questions`)
    .get() as { c: number };
  const nextNum = Number(countRow.c) + 1;
  const code = `Q-${String(nextNum).padStart(2, "0")}`;
  const id = `UQ-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  db.prepare(
    `INSERT INTO unanswered_questions (
      id, code, question, context, addressed_to, category,
      date_raised, status, official_note, related_article_slug, related_doc_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
  ).run(
    id,
    code,
    parsed.data.question,
    parsed.data.context,
    parsed.data.addressed_to,
    parsed.data.category,
    new Date().toISOString().slice(0, 10),
    parsed.data.status,
    parsed.data.official_note ?? null
  );

  recordAuditLog(session.username, "CREATE_QUESTION", "QUESTION", id, code);
  return NextResponse.json({ id, code }, { status: 201 });
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

  const parsed = patchQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const db = getDb();
  const res = db
    .prepare(
      `UPDATE unanswered_questions SET status = ?, official_note = ? WHERE id = ?`
    )
    .run(
      parsed.data.status,
      parsed.data.official_note ?? null,
      parsed.data.id
    );

  if (res.changes === 0) {
    return NextResponse.json({ error: "Pertanyaan tidak ditemukan." }, { status: 404 });
  }

  recordAuditLog(
    session.username,
    "UPDATE_QUESTION",
    "QUESTION",
    parsed.data.id,
    parsed.data.status
  );
  return NextResponse.json({ ok: true });
}
