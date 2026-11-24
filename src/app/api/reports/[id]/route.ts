import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, getUploadsDir } from "@/lib/db/client";
import { getAdminSession, recordAuditLog } from "@/lib/auth";

const updateModerationSchema = z.object({
  moderation_status: z.enum([
    "DITERIMA",
    "VERIFIKASI_AWAL",
    "INVESTIGASI_LANJUT",
    "TERVERIFIKASI",
    "DITOLAK",
    "DIARSIPKAN",
  ]),
  editor_public_note: z.string().trim().max(2000).optional().nullable(),
  editor_internal_note: z.string().trim().max(4000).optional().nullable(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";

  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, tracking_code, attachment_original_name, attachment_stored_name, attachment_mime
       FROM whistleblower_reports WHERE id = ?`
    )
    .get(id) as
    | {
        id: string;
        tracking_code: string;
        attachment_original_name: string | null;
        attachment_stored_name: string | null;
        attachment_mime: string | null;
      }
    | undefined;

  if (!row) {
    return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }

  if (download) {
    if (!row.attachment_stored_name) {
      return NextResponse.json(
        { error: "Laporan ini tidak memiliki lampiran file." },
        { status: 404 }
      );
    }
    const safeName = path.basename(row.attachment_stored_name);
    const fullPath = path.join(getUploadsDir(), safeName);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: "File lampiran tidak ditemukan di penyimpanan terisolasi." },
        { status: 404 }
      );
    }

    const bytes = fs.readFileSync(fullPath);
    recordAuditLog(
      session.username,
      "DOWNLOAD_TIP_ATTACHMENT",
      "REPORT",
      row.id,
      row.tracking_code
    );

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": row.attachment_mime || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${(row.attachment_original_name || safeName).replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return NextResponse.json({ report: row });
}

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

  const parsed = updateModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data moderasi tidak valid.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = getDb();
  const res = db
    .prepare(
      `UPDATE whistleblower_reports
       SET moderation_status = ?,
           editor_public_note = ?,
           editor_internal_note = ?,
           updated_at = ?
       WHERE id = ?`
    )
    .run(
      parsed.data.moderation_status,
      parsed.data.editor_public_note ?? null,
      parsed.data.editor_internal_note ?? null,
      new Date().toISOString(),
      id
    );

  if (res.changes === 0) {
    return NextResponse.json(
      { error: "Laporan tidak ditemukan." },
      { status: 404 }
    );
  }

  recordAuditLog(
    session.username,
    "MODERATE_REPORT",
    "REPORT",
    id,
    parsed.data.moderation_status
  );

  return NextResponse.json({ ok: true, id });
}
