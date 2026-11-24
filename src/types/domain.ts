export type VerificationStatus =
  | "TERBUKTI"
  | "TERDOKUMENTASI"
  | "DUGAAN"
  | "BELUM TERVERIFIKASI"
  | "BANTAHAN";

export type EditorialState = "DRAFT" | "REVIEW" | "PUBLISHED";

export type ClaimType =
  | "FAKTA"
  | "ANALISIS"
  | "DUGAAN"
  | "PERTANYAAN"
  | "KONTEKS";

export type EntityType = "INDIVIDU" | "PERUSAHAAN" | "LEMBAGA" | "PROYEK";

export type DocumentType =
  | "REGULASI"
  | "LAPORAN_KEUANGAN"
  | "KEPUTUSAN_PRESIDEN"
  | "PUTUSAN_MK"
  | "LAPORAN_TAHUNAN"
  | "ANALISIS_DATA";

export type ModerationStatus =
  | "DITERIMA"
  | "VERIFIKASI_AWAL"
  | "INVESTIGASI_LANJUT"
  | "TERVERIFIKASI"
  | "DITOLAK"
  | "DIARSIPKAN";

export type QuestionStatus =
  | "BELUM DIJAWAB"
  | "DIJAWAB PARSIAL"
  | "KLARIFIKASI TERCATAT";

export interface CategoryRecord {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  article_count?: number;
}

export interface ArticleSection {
  id: string;
  heading: string;
  claim_type: ClaimType;
  paragraphs: string[];
  callout?: {
    label: string;
    text: string;
    source_ref?: string;
  };
  quote?: {
    text: string;
    attribution: string;
    page_ref: string;
  };
}

export interface ArticleKeyFinding {
  status: VerificationStatus;
  text: string;
  doc_id?: string;
  page_ref?: string;
}

export interface ArticleSourceRecord {
  id: string;
  article_id: string;
  document_id: string | null;
  source_title: string;
  source_publisher: string;
  source_url: string | null;
  page_ref: string;
  quote_excerpt: string;
  evidence_type: VerificationStatus;
}

export interface ArticleCorrectionRecord {
  id: string;
  article_id: string;
  correction_date: string;
  correction_type: string;
  summary: string;
  previous_text: string | null;
  updated_text: string | null;
  editor_name: string;
}

export interface ArticleRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category_slug: string;
  category_name?: string;
  category_code?: string;
  verification_status: VerificationStatus;
  editorial_state: EditorialState;
  is_featured: number;
  cover_image: string | null;
  cover_caption: string | null;
  authors: string;
  reading_time_min: number;
  methodology: string;
  body_sections: ArticleSection[];
  key_findings: ArticleKeyFinding[];
  unanswered_in_article: string[];
  published_at: string;
  updated_at: string;
  view_count: number;
}

export interface PositionHistoryItem {
  period: string;
  role: string;
  institution: string;
  source_ref: string;
  status: VerificationStatus;
}

export interface EntityChronologyItem {
  date: string;
  title: string;
  description: string;
  doc_id?: string;
  status: VerificationStatus;
}

export interface EntityMetricItem {
  label: string;
  value: string;
  note: string;
}

export interface EntityRecord {
  id: string;
  slug: string;
  name: string;
  entity_type: EntityType;
  current_role: string;
  organization: string | null;
  sector: string;
  transaction_value_idr_t: number | null;
  year_active: number;
  verification_status: VerificationStatus;
  summary: string;
  positions_history: PositionHistoryItem[];
  chronology: EntityChronologyItem[];
  key_metrics: EntityMetricItem[];
  created_at: string;
  updated_at: string;
}

export interface EntityRelationView {
  id: string;
  direction: "OUTGOING" | "INCOMING";
  relation_type: string;
  description: string;
  period: string;
  verification_status: VerificationStatus;
  document_id: string | null;
  source_ref: string;
  other_entity: {
    id: string;
    slug: string;
    name: string;
    entity_type: EntityType;
    current_role: string;
  };
}

export interface DocumentCitation {
  page: number;
  section: string;
  quote: string;
  analysis_note: string;
}

export interface DocumentPageText {
  page: number;
  heading: string;
  content: string;
}

export interface DocumentRecord {
  id: string;
  slug: string;
  title: string;
  doc_type: DocumentType;
  issuer: string;
  doc_number: string;
  published_date: string;
  period_year: number;
  page_count: number;
  file_path: string;
  file_size_kb: number;
  sha256_hash: string;
  original_source_url: string;
  verification_status: VerificationStatus;
  summary: string;
  key_citations: DocumentCitation[];
  pages_text: DocumentPageText[];
  comparison_group: string | null;
  created_at: string;
}

export interface FinancialRecord {
  id: string;
  entity_slug: string;
  entity_name: string;
  ticker: string | null;
  sector: string;
  fiscal_year: number;
  total_assets_idr_t: number;
  net_profit_idr_t: number;
  dividend_idr_t: number;
  equity_idr_t: number | null;
  customer_deposits_or_liabilities_idr_t: number | null;
  state_ownership_pct: number;
  data_status: string;
  source_doc_id: string | null;
  notes: string;
}

export interface TimelineEventRecord {
  id: string;
  event_date: string;
  display_date: string;
  year: number;
  title: string;
  category: string;
  verification_status: VerificationStatus;
  summary: string;
  impact_analysis: string;
  document_id: string | null;
  related_article_slug: string | null;
  related_entity_slug: string | null;
}

export interface UnansweredQuestionRecord {
  id: string;
  code: string;
  question: string;
  context: string;
  addressed_to: string;
  category: string;
  date_raised: string;
  status: QuestionStatus;
  official_note: string | null;
  related_article_slug: string | null;
  related_doc_id: string | null;
}

export interface RightOfReplyRecord {
  id: string;
  respondent_name: string;
  respondent_role: string;
  response_date: string;
  related_article_slug: string | null;
  topic: string;
  editorial_claim_summary: string;
  official_response_text: string;
  editorial_verification_note: string;
  source_url: string | null;
  status: "DIPUBLIKASIKAN" | "MENUNGGU_MODERASI";
  created_at: string;
}

export interface WhistleblowerReportRecord {
  id: string;
  tracking_code: string;
  anonymity_mode: "ANONIM" | "SAMARAN" | "TERVERIFIKASI_RAHASIA";
  reporter_alias: string | null;
  contact_channel: string | null;
  category: string;
  subject_entities: string;
  incident_period: string;
  estimated_value: string | null;
  title: string;
  chronology: string;
  evidence_description: string | null;
  attachment_original_name: string | null;
  attachment_stored_name: string | null;
  attachment_mime: string | null;
  attachment_size_bytes: number | null;
  attachment_sha256: string | null;
  risk_level: "RENDAH" | "SEDANG" | "TINGGI";
  moderation_status: ModerationStatus;
  editor_public_note: string | null;
  editor_internal_note: string | null;
  created_at: string;
  updated_at: string;
}
