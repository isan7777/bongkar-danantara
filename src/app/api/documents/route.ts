import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { listDocuments } from "@/lib/db/queries";
import { getAdminSession, recordAuditLog } from "@/lib/auth";
import {
  MAX_UPLOAD_BYTES,
  computeSha256,
  slugify,
  validateUploadMagicBytes,
} from "@/lib/security";

const uploadDocMetaSchema = z.object({
  title: z.string().trim().min(6).max(240),
  doc_number: z.string().trim().min(2).max(100),
  issuer: z.string().trim().min(3).max(180),
  doc_type: z.enum([
    "REGULASI",
    "LAPORAN_KEUANGAN",
    "KEPUTUSAN_PRESIDEN",
    "PUTUSAN_MK",
    "LAPORAN_TAHUNAN",
    "ANALISIS_DATA",
  ]),
  published_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_year: z.coerce.number().int().min(1998).max(2030),
  page_count: z.coerce.number().int().min(1).max(2000).default(1),
  original_source_url: z.string().trim().url(),
  verification_status: z.enum([
    "TERBUKTI",
    "TERDOKUMENTASI",
    "BELUM TERVERIFIKASI",
  ]),
  summary: z.string().trim().min(15).max(1500),
  key_quote: z.string().trim().min(5).max(800),
  key_quote_page: z.coerce.number().int().min(1).default(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const type = searchParams.get("type") || undefined;
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  const documents = listDocuments({ q, type, year });
  return NextResponse.json({ documents, total: documents.length });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format unggahan harus multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "File PDF wajib diunggah." },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Ukuran file PDF melebihi batas 10 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateUploadMagicBytes(buffer, ".pdf")) {
    return NextResponse.json(
      { error: "File ditolak. Hanya dokumen PDF valid (%PDF-) yang diizinkan." },
      { status: 400 }
    );
  }

  const metaParsed = uploadDocMetaSchema.safeParse({
    title: formData.get("title"),
    doc_number: formData.get("doc_number"),
    issuer: formData.get("issuer"),
    doc_type: formData.get("doc_type"),
    published_date: formData.get("published_date"),
    period_year: formData.get("period_year"),
    page_count: formData.get("page_count"),
    original_source_url: formData.get("original_source_url"),
    verification_status: formData.get("verification_status"),
    summary: formData.get("summary"),
    key_quote: formData.get("key_quote"),
    key_quote_page: formData.get("key_quote_page"),
  });

  if (!metaParsed.success) {
    return NextResponse.json(
      {
        error: "Metadata dokumen tidak valid.",
        issues: metaParsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const meta = metaParsed.data;
  const id = `DOC-${meta.period_year}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const slug = `${slugify(meta.title)}-${crypto.randomInt(100, 999)}`;
  const docsDir = path.join(process.cwd(), "public", "documents");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const filename = `${id}.pdf`;
  fs.writeFileSync(path.join(docsDir, filename), buffer);

  const sha256 = computeSha256(buffer);
  const sizeKb = Math.max(1, Math.round(buffer.length / 1024));

  const db = getDb();
  db.prepare(
    `INSERT INTO documents (
      id, slug, title, doc_type, issuer, doc_number, published_date, period_year,
      page_count, file_path, file_size_kb, sha256_hash, original_source_url,
      verification_status, summary, key_citations_json, pages_text_json,
      comparison_group, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    slug,
    meta.title,
    meta.doc_type,
    meta.issuer,
    meta.doc_number,
    meta.published_date,
    meta.period_year,
    meta.page_count,
    `/documents/${filename}`,
    sizeKb,
    sha256,
    meta.original_source_url,
    meta.verification_status,
    meta.summary,
    JSON.stringify([
      {
        page: meta.key_quote_page,
        section: "Kutipan Kunci Terunggah",
        quote: meta.key_quote,
        analysis_note: "Diarsipkan melalui Dashboard Redaksi Bongkar Danantara.",
      },
    ]),
    JSON.stringify([
      {
        page: meta.key_quote_page,
        heading: `${meta.doc_number} — Ringkasan`,
        content: `${meta.summary}\n\nKutipan Kunci: "${meta.key_quote}"`,
      },
    ]),
    null,
    new Date().toISOString()
  );

  recordAuditLog(session.username, "UPLOAD_DOCUMENT", "DOCUMENT", id, meta.title);
  return NextResponse.json({ id, slug, sha256_hash: sha256 }, { status: 201 });
}
