import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { listArticles } from "@/lib/db/queries";
import { getAdminSession, recordAuditLog } from "@/lib/auth";
import { slugify } from "@/lib/security";

const createArticleSchema = z.object({
  title: z.string().trim().min(10).max(240),
  subtitle: z.string().trim().min(10).max(500),
  excerpt: z.string().trim().min(10).max(600),
  category_slug: z.enum([
    "jejak-uang",
    "siapa-di-balik-kekuasaan",
    "dokumen-terbuka",
    "konflik-kepentingan",
    "kebijakan-bermasalah",
    "investigasi-mendalam",
  ]),
  verification_status: z.enum([
    "TERBUKTI",
    "TERDOKUMENTASI",
    "DUGAAN",
    "BELUM TERVERIFIKASI",
    "BANTAHAN",
  ]),
  editorial_state: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]).default("PUBLISHED"),
  is_featured: z.boolean().default(false),
  authors: z.string().trim().min(3).max(160),
  reading_time_min: z.number().int().min(1).max(60).default(6),
  methodology: z.string().trim().min(15).max(1500),
  body_text: z.string().trim().min(40),
  claim_type: z
    .enum(["FAKTA", "ANALISIS", "DUGAAN", "PERTANYAAN", "KONTEKS"])
    .default("ANALISIS"),
  source_title: z.string().trim().min(5).max(260),
  source_publisher: z.string().trim().min(3).max(180),
  source_page_ref: z.string().trim().min(2).max(120),
  source_quote: z.string().trim().min(10).max(800),
  document_id: z.string().trim().optional().nullable(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;
  const includeDraftsParam = searchParams.get("includeDrafts") === "1";

  let includeDrafts = false;
  if (includeDraftsParam) {
    const session = await getAdminSession();
    if (session) includeDrafts = true;
  }

  const articles = listArticles({ category, status, q, includeDrafts });
  return NextResponse.json({ articles, total: articles.length });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Autentikasi redaksi diperlukan." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format JSON tidak valid." },
      { status: 400 }
    );
  }

  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validasi data artikel gagal.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const id = `ART-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const baseSlug = slugify(data.title);
  const slug = `${baseSlug}-${crypto.randomInt(100, 999)}`;
  const today = new Date().toISOString().slice(0, 10);

  const paragraphs = data.body_text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const bodySections = [
    {
      id: "sec-1",
      heading: "Laporan dan Verifikasi Lapangan",
      claim_type: data.claim_type,
      paragraphs: paragraphs.length > 0 ? paragraphs : [data.body_text],
    },
  ];

  const keyFindings = [
    {
      status: data.verification_status,
      text: data.excerpt,
      doc_id: data.document_id || undefined,
      page_ref: data.source_page_ref,
    },
  ];

  const db = getDb();
  db.exec("BEGIN TRANSACTION");
  try {
    db.prepare(
      `INSERT INTO articles (
        id, slug, title, subtitle, excerpt, category_slug, verification_status,
        editorial_state, is_featured, cover_image, cover_caption, authors,
        reading_time_min, methodology, body_sections_json, key_findings_json,
        unanswered_in_article_json, published_at, updated_at, view_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    ).run(
      id,
      slug,
      data.title,
      data.subtitle,
      data.excerpt,
      data.category_slug,
      data.verification_status,
      data.editorial_state,
      data.is_featured ? 1 : 0,
      "/images/plate-neraca-aum.svg",
      "Ilustrasi arsip investigasi Bongkar Danantara.",
      data.authors,
      data.reading_time_min,
      data.methodology,
      JSON.stringify(bodySections),
      JSON.stringify(keyFindings),
      JSON.stringify([]),
      today,
      today
    );

    db.prepare(
      `INSERT INTO article_sources (
        id, article_id, document_id, source_title, source_publisher,
        source_url, page_ref, quote_excerpt, evidence_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `SRC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      id,
      data.document_id || null,
      data.source_title,
      data.source_publisher,
      null,
      data.source_page_ref,
      data.source_quote,
      data.verification_status === "TERBUKTI" ? "TERBUKTI" : "TERDOKUMENTASI"
    );

    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  recordAuditLog(session.username, "CREATE_ARTICLE", "ARTICLE", id, data.title);

  return NextResponse.json({ id, slug }, { status: 201 });
}
