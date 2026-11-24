import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { listEntities, listEntityFacets } from "@/lib/db/queries";
import { getAdminSession, recordAuditLog } from "@/lib/auth";
import { slugify } from "@/lib/security";

const createEntitySchema = z.object({
  name: z.string().trim().min(2).max(160),
  entity_type: z.enum(["INDIVIDU", "PERUSAHAAN", "LEMBAGA", "PROYEK"]),
  current_role: z.string().trim().min(3).max(200),
  organization: z.string().trim().max(180).optional().nullable(),
  sector: z.string().trim().min(2).max(120),
  transaction_value_idr_t: z.number().nonnegative().optional().nullable(),
  year_active: z.number().int().min(1990).max(2030).default(2025),
  verification_status: z.enum([
    "TERBUKTI",
    "TERDOKUMENTASI",
    "DUGAAN",
    "BELUM TERVERIFIKASI",
    "BANTAHAN",
  ]),
  summary: z.string().trim().min(15).max(1500),
  source_ref: z.string().trim().min(3).max(200),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const type = searchParams.get("type") || undefined;
  const sector = searchParams.get("sector") || undefined;
  const yearParam = searchParams.get("year");
  const minValParam = searchParams.get("minValue");
  const docId = searchParams.get("docId") || undefined;

  const year = yearParam ? Number(yearParam) : undefined;
  const minValue = minValParam ? Number(minValParam) : undefined;

  const entities = listEntities({ q, type, sector, year, minValue, docId });
  const facets = listEntityFacets();
  return NextResponse.json({ entities, total: entities.length, facets });
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

  const parsed = createEntitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data entitas tidak valid.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const id = `ENT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const slug = `${slugify(data.name)}-${crypto.randomInt(100, 999)}`;
  const now = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO entities (
      id, slug, name, entity_type, current_role, organization, sector,
      transaction_value_idr_t, year_active, verification_status, summary,
      positions_history_json, chronology_json, key_metrics_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    slug,
    data.name,
    data.entity_type,
    data.current_role,
    data.organization ?? null,
    data.sector,
    data.transaction_value_idr_t ?? null,
    data.year_active,
    data.verification_status,
    data.summary,
    JSON.stringify([
      {
        period: `${data.year_active} - Sekarang`,
        role: data.current_role,
        institution: data.organization || data.name,
        source_ref: data.source_ref,
        status: data.verification_status,
      },
    ]),
    JSON.stringify([]),
    JSON.stringify([]),
    now,
    now
  );

  recordAuditLog(session.username, "CREATE_ENTITY", "ENTITY", id, data.name);
  return NextResponse.json({ id, slug }, { status: 201 });
}
