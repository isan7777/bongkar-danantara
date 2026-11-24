import { getDb } from "./client";
import type {
  ArticleCorrectionRecord,
  ArticleKeyFinding,
  ArticleRecord,
  ArticleSection,
  ArticleSourceRecord,
  CategoryRecord,
  DocumentCitation,
  DocumentPageText,
  DocumentRecord,
  EntityChronologyItem,
  EntityMetricItem,
  EntityRecord,
  EntityRelationView,
  FinancialRecord,
  PositionHistoryItem,
  RightOfReplyRecord,
  TimelineEventRecord,
  UnansweredQuestionRecord,
  VerificationStatus,
  WhistleblowerReportRecord,
} from "@/types/domain";

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Node 24's node:sqlite returns rows with a null prototype (Object.create(null)),
 * which React Server Component serialization rejects when passed to Client Components.
 * Normalizing once at the query boundary guarantees plain Object.prototype records.
 */
function toPlainRows<T>(rows: unknown[]): T[] {
  return rows.map((row) => ({ ...(row as Record<string, unknown>) }) as T);
}

function mapArticleRow(row: Record<string, unknown>): ArticleRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    subtitle: String(row.subtitle),
    excerpt: String(row.excerpt),
    category_slug: String(row.category_slug),
    category_name: row.category_name ? String(row.category_name) : undefined,
    category_code: row.category_code ? String(row.category_code) : undefined,
    verification_status: String(row.verification_status) as VerificationStatus,
    editorial_state: String(row.editorial_state) as ArticleRecord["editorial_state"],
    is_featured: Number(row.is_featured ?? 0),
    cover_image: row.cover_image ? String(row.cover_image) : null,
    cover_caption: row.cover_caption ? String(row.cover_caption) : null,
    authors: String(row.authors),
    reading_time_min: Number(row.reading_time_min ?? 6),
    methodology: String(row.methodology),
    body_sections: safeParseJson<ArticleSection[]>(
      row.body_sections_json as string,
      []
    ),
    key_findings: safeParseJson<ArticleKeyFinding[]>(
      row.key_findings_json as string,
      []
    ),
    unanswered_in_article: safeParseJson<string[]>(
      row.unanswered_in_article_json as string,
      []
    ),
    published_at: String(row.published_at),
    updated_at: String(row.updated_at),
    view_count: Number(row.view_count ?? 0),
  };
}

function mapEntityRow(row: Record<string, unknown>): EntityRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    entity_type: String(row.entity_type) as EntityRecord["entity_type"],
    current_role: String(row.current_role),
    organization: row.organization ? String(row.organization) : null,
    sector: String(row.sector),
    transaction_value_idr_t:
      row.transaction_value_idr_t === null ||
      row.transaction_value_idr_t === undefined
        ? null
        : Number(row.transaction_value_idr_t),
    year_active: Number(row.year_active),
    verification_status: String(row.verification_status) as VerificationStatus,
    summary: String(row.summary),
    positions_history: safeParseJson<PositionHistoryItem[]>(
      row.positions_history_json as string,
      []
    ),
    chronology: safeParseJson<EntityChronologyItem[]>(
      row.chronology_json as string,
      []
    ),
    key_metrics: safeParseJson<EntityMetricItem[]>(
      row.key_metrics_json as string,
      []
    ),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapDocumentRow(row: Record<string, unknown>): DocumentRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    doc_type: String(row.doc_type) as DocumentRecord["doc_type"],
    issuer: String(row.issuer),
    doc_number: String(row.doc_number),
    published_date: String(row.published_date),
    period_year: Number(row.period_year),
    page_count: Number(row.page_count),
    file_path: String(row.file_path),
    file_size_kb: Number(row.file_size_kb),
    sha256_hash: String(row.sha256_hash),
    original_source_url: String(row.original_source_url),
    verification_status: String(row.verification_status) as VerificationStatus,
    summary: String(row.summary),
    key_citations: safeParseJson<DocumentCitation[]>(
      row.key_citations_json as string,
      []
    ),
    pages_text: safeParseJson<DocumentPageText[]>(
      row.pages_text_json as string,
      []
    ),
    comparison_group: row.comparison_group ? String(row.comparison_group) : null,
    created_at: String(row.created_at),
  };
}

export function listCategories(): CategoryRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM articles a WHERE a.category_slug = c.slug AND a.editorial_state = 'PUBLISHED') AS article_count
       FROM categories c
       ORDER BY c.sort_order ASC`
    )
    .all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    code: String(r.code),
    name: String(r.name),
    description: String(r.description),
    sort_order: Number(r.sort_order),
    article_count: Number(r.article_count ?? 0),
  }));
}

export function getCategoryBySlug(slug: string): CategoryRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM categories WHERE slug = ?`)
    .get(slug) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    code: String(row.code),
    name: String(row.name),
    description: String(row.description),
    sort_order: Number(row.sort_order),
  };
}

export function listArticles(options?: {
  category?: string;
  status?: string;
  q?: string;
  includeDrafts?: boolean;
  limit?: number;
}): ArticleRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!options?.includeDrafts) {
    conditions.push("a.editorial_state = 'PUBLISHED'");
  }
  if (options?.category) {
    conditions.push("a.category_slug = ?");
    params.push(options.category);
  }
  if (options?.status) {
    conditions.push("a.verification_status = ?");
    params.push(options.status);
  }
  if (options?.q) {
    const like = `%${options.q.trim()}%`;
    conditions.push(
      "(a.title LIKE ? OR a.subtitle LIKE ? OR a.excerpt LIKE ? OR a.body_sections_json LIKE ?)"
    );
    params.push(like, like, like, like);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitClause = options?.limit ? `LIMIT ${Math.max(1, Math.min(100, options.limit))}` : "";

  const rows = db
    .prepare(
      `SELECT a.*, c.name AS category_name, c.code AS category_code
       FROM articles a
       LEFT JOIN categories c ON c.slug = a.category_slug
       ${whereClause}
       ORDER BY a.is_featured DESC, a.published_at DESC
       ${limitClause}`
    )
    .all(...params) as Record<string, unknown>[];

  return rows.map(mapArticleRow);
}

export function getArticleDetail(slug: string, includeDrafts = false): {
  article: ArticleRecord;
  sources: ArticleSourceRecord[];
  corrections: ArticleCorrectionRecord[];
  entities: EntityRecord[];
  replies: RightOfReplyRecord[];
} | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.*, c.name AS category_name, c.code AS category_code
       FROM articles a
       LEFT JOIN categories c ON c.slug = a.category_slug
       WHERE a.slug = ? ${includeDrafts ? "" : "AND a.editorial_state = 'PUBLISHED'"}`
    )
    .get(slug) as Record<string, unknown> | undefined;

  if (!row) return null;

  const article = mapArticleRow(row);

  const sources = toPlainRows<ArticleSourceRecord>(
    db
      .prepare(`SELECT * FROM article_sources WHERE article_id = ? ORDER BY id ASC`)
      .all(article.id)
  );

  const corrections = toPlainRows<ArticleCorrectionRecord>(
    db
      .prepare(
        `SELECT * FROM article_corrections WHERE article_id = ? ORDER BY correction_date DESC`
      )
      .all(article.id)
  );

  const entityRows = db
    .prepare(
      `SELECT e.* FROM entities e
       INNER JOIN article_entities ae ON ae.entity_id = e.id
       WHERE ae.article_id = ?
       ORDER BY e.entity_type ASC, e.name ASC`
    )
    .all(article.id) as Record<string, unknown>[];

  const replies = toPlainRows<RightOfReplyRecord>(
    db
      .prepare(
        `SELECT * FROM right_of_replies
         WHERE related_article_slug = ? AND status = 'DIPUBLIKASIKAN'
         ORDER BY response_date DESC`
      )
      .all(article.slug)
  );

  return {
    article,
    sources,
    corrections,
    entities: entityRows.map(mapEntityRow),
    replies,
  };
}

export function listEntities(options?: {
  q?: string;
  type?: string;
  sector?: string;
  year?: number;
  minValue?: number;
  docId?: string;
}): EntityRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.q) {
    const like = `%${options.q.trim()}%`;
    conditions.push(
      "(e.name LIKE ? OR e.current_role LIKE ? OR COALESCE(e.organization, '') LIKE ? OR e.summary LIKE ? OR e.sector LIKE ?)"
    );
    params.push(like, like, like, like, like);
  }
  if (options?.type) {
    conditions.push("e.entity_type = ?");
    params.push(options.type);
  }
  if (options?.sector) {
    conditions.push("e.sector = ?");
    params.push(options.sector);
  }
  if (options?.year && !Number.isNaN(options.year)) {
    conditions.push("e.year_active = ?");
    params.push(options.year);
  }
  if (options?.minValue !== undefined && !Number.isNaN(options.minValue)) {
    conditions.push("COALESCE(e.transaction_value_idr_t, 0) >= ?");
    params.push(options.minValue);
  }
  if (options?.docId) {
    conditions.push(
      `(e.chronology_json LIKE ? OR e.id IN (
          SELECT source_entity_id FROM entity_relations WHERE document_id = ?
          UNION
          SELECT target_entity_id FROM entity_relations WHERE document_id = ?
       ))`
    );
    params.push(`%${options.docId}%`, options.docId, options.docId);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT e.* FROM entities e
       ${whereClause}
       ORDER BY COALESCE(e.transaction_value_idr_t, -1) DESC, e.entity_type ASC, e.name ASC`
    )
    .all(...params) as Record<string, unknown>[];

  return rows.map(mapEntityRow);
}

export function listEntityFacets(): {
  sectors: string[];
  years: number[];
} {
  const db = getDb();
  const sectorRows = db
    .prepare(`SELECT DISTINCT sector FROM entities ORDER BY sector ASC`)
    .all() as { sector: string }[];
  const yearRows = db
    .prepare(`SELECT DISTINCT year_active FROM entities ORDER BY year_active DESC`)
    .all() as { year_active: number }[];
  return {
    sectors: sectorRows.map((r) => r.sector),
    years: yearRows.map((r) => Number(r.year_active)),
  };
}

export function listEntityDocumentMap(): Record<string, string[]> {
  const db = getDb();
  const map: Record<string, Set<string>> = {};
  const add = (entId: string, docId: string) => {
    if (!map[entId]) map[entId] = new Set();
    map[entId].add(docId);
  };
  const rels = db
    .prepare(
      `SELECT source_entity_id, target_entity_id, document_id FROM entity_relations WHERE document_id IS NOT NULL`
    )
    .all() as Array<{
    source_entity_id: string;
    target_entity_id: string;
    document_id: string;
  }>;
  for (const r of rels) {
    add(String(r.source_entity_id), String(r.document_id));
    add(String(r.target_entity_id), String(r.document_id));
  }
  const entities = listEntities();
  for (const e of entities) {
    for (const c of e.chronology) {
      if (c.doc_id) add(e.id, c.doc_id);
    }
  }
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) {
    out[k] = Array.from(v);
  }
  return out;
}

export function getEntityDetail(slug: string): {
  entity: EntityRecord;
  relations: EntityRelationView[];
  articles: ArticleRecord[];
  documents: DocumentRecord[];
  financials: FinancialRecord[];
} | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM entities WHERE slug = ?`)
    .get(slug) as Record<string, unknown> | undefined;
  if (!row) return null;

  const entity = mapEntityRow(row);

  const outgoing = db
    .prepare(
      `SELECT r.*, e.id AS other_id, e.slug AS other_slug, e.name AS other_name, e.entity_type AS other_type, e.current_role AS other_role
       FROM entity_relations r
       INNER JOIN entities e ON e.id = r.target_entity_id
       WHERE r.source_entity_id = ?`
    )
    .all(entity.id) as Record<string, unknown>[];

  const incoming = db
    .prepare(
      `SELECT r.*, e.id AS other_id, e.slug AS other_slug, e.name AS other_name, e.entity_type AS other_type, e.current_role AS other_role
       FROM entity_relations r
       INNER JOIN entities e ON e.id = r.source_entity_id
       WHERE r.target_entity_id = ?`
    )
    .all(entity.id) as Record<string, unknown>[];

  const relations: EntityRelationView[] = [
    ...outgoing.map((r) => ({
      id: String(r.id),
      direction: "OUTGOING" as const,
      relation_type: String(r.relation_type),
      description: String(r.description),
      period: String(r.period),
      verification_status: String(r.verification_status) as VerificationStatus,
      document_id: r.document_id ? String(r.document_id) : null,
      source_ref: String(r.source_ref),
      other_entity: {
        id: String(r.other_id),
        slug: String(r.other_slug),
        name: String(r.other_name),
        entity_type: String(r.other_type) as EntityRecord["entity_type"],
        current_role: String(r.other_role),
      },
    })),
    ...incoming.map((r) => ({
      id: String(r.id),
      direction: "INCOMING" as const,
      relation_type: String(r.relation_type),
      description: String(r.description),
      period: String(r.period),
      verification_status: String(r.verification_status) as VerificationStatus,
      document_id: r.document_id ? String(r.document_id) : null,
      source_ref: String(r.source_ref),
      other_entity: {
        id: String(r.other_id),
        slug: String(r.other_slug),
        name: String(r.other_name),
        entity_type: String(r.other_type) as EntityRecord["entity_type"],
        current_role: String(r.other_role),
      },
    })),
  ];

  const articleRows = db
    .prepare(
      `SELECT a.*, c.name AS category_name, c.code AS category_code
       FROM articles a
       INNER JOIN article_entities ae ON ae.article_id = a.id
       LEFT JOIN categories c ON c.slug = a.category_slug
       WHERE ae.entity_id = ? AND a.editorial_state = 'PUBLISHED'
       ORDER BY a.published_at DESC`
    )
    .all(entity.id) as Record<string, unknown>[];

  const docIds = new Set<string>();
  for (const rel of relations) {
    if (rel.document_id) docIds.add(rel.document_id);
  }
  for (const item of entity.chronology) {
    if (item.doc_id) docIds.add(item.doc_id);
  }

  let documents: DocumentRecord[] = [];
  if (docIds.size > 0) {
    const placeholders = Array.from(docIds)
      .map(() => "?")
      .join(",");
    const docRows = db
      .prepare(`SELECT * FROM documents WHERE id IN (${placeholders}) ORDER BY published_date DESC`)
      .all(...Array.from(docIds)) as Record<string, unknown>[];
    documents = docRows.map(mapDocumentRow);
  }

  const financials = toPlainRows<FinancialRecord>(
    db
      .prepare(
        `SELECT * FROM financial_records WHERE entity_slug = ? ORDER BY fiscal_year DESC`
      )
      .all(entity.slug)
  );

  return {
    entity,
    relations,
    articles: articleRows.map(mapArticleRow),
    documents,
    financials,
  };
}

export function listDocuments(options?: {
  q?: string;
  type?: string;
  year?: number;
}): DocumentRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.q) {
    const like = `%${options.q.trim()}%`;
    conditions.push(
      "(title LIKE ? OR doc_number LIKE ? OR issuer LIKE ? OR summary LIKE ? OR key_citations_json LIKE ? OR pages_text_json LIKE ?)"
    );
    params.push(like, like, like, like, like, like);
  }
  if (options?.type) {
    conditions.push("doc_type = ?");
    params.push(options.type);
  }
  if (options?.year && !Number.isNaN(options.year)) {
    conditions.push("period_year = ?");
    params.push(options.year);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT * FROM documents ${whereClause} ORDER BY published_date DESC, id ASC`
    )
    .all(...params) as Record<string, unknown>[];

  return rows.map(mapDocumentRow);
}

export function getDocumentByIdOrSlug(idOrSlug: string): DocumentRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM documents WHERE id = ? OR slug = ?`)
    .get(idOrSlug, idOrSlug) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapDocumentRow(row);
}

export function listFinancialRecords(year?: number): FinancialRecord[] {
  const db = getDb();
  if (year && !Number.isNaN(year)) {
    return toPlainRows<FinancialRecord>(
      db
        .prepare(
          `SELECT * FROM financial_records WHERE fiscal_year = ? ORDER BY total_assets_idr_t DESC`
        )
        .all(year)
    );
  }
  return toPlainRows<FinancialRecord>(
    db
      .prepare(
        `SELECT * FROM financial_records ORDER BY fiscal_year DESC, total_assets_idr_t DESC`
      )
      .all()
  );
}

export function listTimelineEvents(options?: {
  year?: number;
  category?: string;
  status?: string;
}): TimelineEventRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.year && !Number.isNaN(options.year)) {
    conditions.push("year = ?");
    params.push(options.year);
  }
  if (options?.category) {
    conditions.push("category = ?");
    params.push(options.category);
  }
  if (options?.status) {
    conditions.push("verification_status = ?");
    params.push(options.status);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return toPlainRows<TimelineEventRecord>(
    db
      .prepare(
        `SELECT * FROM timeline_events ${whereClause} ORDER BY event_date DESC`
      )
      .all(...params)
  );
}

export function listUnansweredQuestions(
  status?: string
): UnansweredQuestionRecord[] {
  const db = getDb();
  if (status) {
    return toPlainRows<UnansweredQuestionRecord>(
      db
        .prepare(
          `SELECT * FROM unanswered_questions WHERE status = ? ORDER BY code ASC`
        )
        .all(status)
    );
  }
  return toPlainRows<UnansweredQuestionRecord>(
    db.prepare(`SELECT * FROM unanswered_questions ORDER BY code ASC`).all()
  );
}

export function listRightOfReplies(
  includePending = false
): RightOfReplyRecord[] {
  const db = getDb();
  if (includePending) {
    return toPlainRows<RightOfReplyRecord>(
      db.prepare(`SELECT * FROM right_of_replies ORDER BY response_date DESC`).all()
    );
  }
  return toPlainRows<RightOfReplyRecord>(
    db
      .prepare(
        `SELECT * FROM right_of_replies WHERE status = 'DIPUBLIKASIKAN' ORDER BY response_date DESC`
      )
      .all()
  );
}

export function listAllCorrections(): Array<
  ArticleCorrectionRecord & { article_title: string; article_slug: string }
> {
  const db = getDb();
  return toPlainRows<
    ArticleCorrectionRecord & { article_title: string; article_slug: string }
  >(
    db
      .prepare(
        `SELECT ac.*, a.title AS article_title, a.slug AS article_slug
         FROM article_corrections ac
         INNER JOIN articles a ON a.id = ac.article_id
         ORDER BY ac.correction_date DESC`
      )
      .all()
  );
}

export function listWhistleblowerReports(): WhistleblowerReportRecord[] {
  const db = getDb();
  return toPlainRows<WhistleblowerReportRecord>(
    db
      .prepare(
        `SELECT id, tracking_code, anonymity_mode, reporter_alias, contact_channel,
                category, subject_entities, incident_period, estimated_value,
                title, chronology, evidence_description,
                attachment_original_name, attachment_stored_name, attachment_mime,
                attachment_size_bytes, attachment_sha256, risk_level,
                moderation_status, editor_public_note, editor_internal_note,
                created_at, updated_at
         FROM whistleblower_reports
         ORDER BY created_at DESC`
      )
      .all()
  );
}

export function globalSearch(query: string, typeFilter?: string) {
  const q = query.trim();
  if (!q) {
    return {
      articles: [] as ArticleRecord[],
      entities: [] as EntityRecord[],
      documents: [] as DocumentRecord[],
      timeline: [] as TimelineEventRecord[],
      questions: [] as UnansweredQuestionRecord[],
      replies: [] as RightOfReplyRecord[],
    };
  }
  const db = getDb();
  const like = `%${q}%`;

  const want = (k: string) => !typeFilter || typeFilter === "all" || typeFilter === k;

  const articles = want("articles")
    ? listArticles({ q, limit: 20 })
    : [];

  const entities = want("entities")
    ? listEntities({ q }).slice(0, 20)
    : [];

  const documents = want("documents")
    ? listDocuments({ q }).slice(0, 20)
    : [];

  const timeline = want("timeline")
    ? toPlainRows<TimelineEventRecord>(
        db
          .prepare(
            `SELECT * FROM timeline_events
             WHERE title LIKE ? OR summary LIKE ? OR impact_analysis LIKE ?
             ORDER BY event_date DESC LIMIT 20`
          )
          .all(like, like, like)
      )
    : [];

  const questions = want("questions")
    ? toPlainRows<UnansweredQuestionRecord>(
        db
          .prepare(
            `SELECT * FROM unanswered_questions
             WHERE question LIKE ? OR context LIKE ? OR addressed_to LIKE ?
             ORDER BY code ASC LIMIT 20`
          )
          .all(like, like, like)
      )
    : [];

  const replies = want("replies")
    ? toPlainRows<RightOfReplyRecord>(
        db
          .prepare(
            `SELECT * FROM right_of_replies
             WHERE status = 'DIPUBLIKASIKAN'
               AND (topic LIKE ? OR respondent_name LIKE ? OR official_response_text LIKE ? OR editorial_claim_summary LIKE ?)
             ORDER BY response_date DESC LIMIT 20`
          )
          .all(like, like, like, like)
      )
    : [];

  return { articles, entities, documents, timeline, questions, replies };
}

export function getPlatformStats() {
  const db = getDb();
  const articlesPublished = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM articles WHERE editorial_state = 'PUBLISHED'`
        )
        .get() as { c: number }
    ).c
  );
  const documentsTotal = Number(
    (db.prepare(`SELECT COUNT(*) AS c FROM documents`).get() as { c: number }).c
  );
  const entitiesTotal = Number(
    (db.prepare(`SELECT COUNT(*) AS c FROM entities`).get() as { c: number }).c
  );
  const relationsTotal = Number(
    (
      db.prepare(`SELECT COUNT(*) AS c FROM entity_relations`).get() as {
        c: number;
      }
    ).c
  );
  const unansweredOpen = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM unanswered_questions WHERE status != 'KLARIFIKASI TERCATAT'`
        )
        .get() as { c: number }
    ).c
  );
  const repliesTotal = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM right_of_replies WHERE status = 'DIPUBLIKASIKAN'`
        )
        .get() as { c: number }
    ).c
  );
  const reportsPending = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM whistleblower_reports WHERE moderation_status IN ('DITERIMA', 'VERIFIKASI_AWAL', 'INVESTIGASI_LANJUT')`
        )
        .get() as { c: number }
    ).c
  );
  const reportsTotal = Number(
    (
      db.prepare(`SELECT COUNT(*) AS c FROM whistleblower_reports`).get() as {
        c: number;
      }
    ).c
  );

  return {
    articlesPublished,
    documentsTotal,
    entitiesTotal,
    relationsTotal,
    unansweredOpen,
    repliesTotal,
    reportsPending,
    reportsTotal,
  };
}
