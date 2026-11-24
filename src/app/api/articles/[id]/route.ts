import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { getAdminSession, recordAuditLog } from "@/lib/auth";

const updateArticleSchema = z.object({
  verification_status: z
    .enum([
      "TERBUKTI",
      "TERDOKUMENTASI",
      "DUGAAN",
      "BELUM TERVERIFIKASI",
      "BANTAHAN",
    ])
    .optional(),
  editorial_state: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]).optional(),
  is_featured: z.boolean().optional(),
  correction_note: z
    .object({
      correction_type: z.enum([
        "KOREKSI_DATA",
        "PEMBARUAN_DOKUMEN",
        "TAMBAHAN_HAK_JAWAB",
        "KLARIFIKASI",
      ]),
      summary: z.string().trim().min(10).max(800),
      previous_text: z.string().trim().max(600).optional(),
      updated_text: z.string().trim().max(600).optional(),
    })
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid." }, { status: 400 });
  }

  const parsed = updateArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data pembaruan tidak valid.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = db
    .prepare(`SELECT id, title FROM articles WHERE id = ?`)
    .get(id) as { id: string; title: string } | undefined;
  if (!existing) {
    return NextResponse.json(
      { error: "Artikel tidak ditemukan." },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const updates: string[] = ["updated_at = ?"];
  const params: (string | number)[] = [today];

  if (parsed.data.verification_status) {
    updates.push("verification_status = ?");
    params.push(parsed.data.verification_status);
  }
  if (parsed.data.editorial_state) {
    updates.push("editorial_state = ?");
    params.push(parsed.data.editorial_state);
  }
  if (parsed.data.is_featured !== undefined) {
    updates.push("is_featured = ?");
    params.push(parsed.data.is_featured ? 1 : 0);
  }

  db.exec("BEGIN TRANSACTION");
  try {
    params.push(id);
    db.prepare(`UPDATE articles SET ${updates.join(", ")} WHERE id = ?`).run(
      ...params
    );

    if (parsed.data.correction_note) {
      db.prepare(
        `INSERT INTO article_corrections (
          id, article_id, correction_date, correction_type, summary,
          previous_text, updated_text, editor_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        `COR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        id,
        today,
        parsed.data.correction_note.correction_type,
        parsed.data.correction_note.summary,
        parsed.data.correction_note.previous_text ?? null,
        parsed.data.correction_note.updated_text ?? null,
        session.displayName
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  recordAuditLog(session.username, "UPDATE_ARTICLE", "ARTICLE", id, existing.title);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const { id } = await context.params;
  const db = getDb();
  const res = db.prepare(`DELETE FROM articles WHERE id = ?`).run(id);
  if (res.changes === 0) {
    return NextResponse.json(
      { error: "Artikel tidak ditemukan." },
      { status: 404 }
    );
  }

  recordAuditLog(session.username, "DELETE_ARTICLE", "ARTICLE", id);
  return NextResponse.json({ ok: true });
}
