import type { DatabaseSync } from "node:sqlite";

export function applySchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      issuer TEXT NOT NULL,
      doc_number TEXT NOT NULL,
      published_date TEXT NOT NULL,
      period_year INTEGER NOT NULL,
      page_count INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_size_kb INTEGER NOT NULL,
      sha256_hash TEXT NOT NULL,
      original_source_url TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      summary TEXT NOT NULL,
      key_citations_json TEXT NOT NULL,
      pages_text_json TEXT NOT NULL,
      comparison_group TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      category_slug TEXT NOT NULL REFERENCES categories(slug),
      verification_status TEXT NOT NULL,
      editorial_state TEXT NOT NULL DEFAULT 'PUBLISHED',
      is_featured INTEGER NOT NULL DEFAULT 0,
      cover_image TEXT,
      cover_caption TEXT,
      authors TEXT NOT NULL,
      reading_time_min INTEGER NOT NULL,
      methodology TEXT NOT NULL,
      body_sections_json TEXT NOT NULL,
      key_findings_json TEXT NOT NULL,
      unanswered_in_article_json TEXT NOT NULL,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS article_sources (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
      source_title TEXT NOT NULL,
      source_publisher TEXT NOT NULL,
      source_url TEXT,
      page_ref TEXT NOT NULL,
      quote_excerpt TEXT NOT NULL,
      evidence_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_corrections (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      correction_date TEXT NOT NULL,
      correction_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      previous_text TEXT,
      updated_text TEXT,
      editor_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      current_role TEXT NOT NULL,
      organization TEXT,
      sector TEXT NOT NULL,
      transaction_value_idr_t REAL,
      year_active INTEGER NOT NULL,
      verification_status TEXT NOT NULL,
      summary TEXT NOT NULL,
      positions_history_json TEXT NOT NULL,
      chronology_json TEXT NOT NULL,
      key_metrics_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entity_relations (
      id TEXT PRIMARY KEY,
      source_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      target_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL,
      description TEXT NOT NULL,
      period TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
      source_ref TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_entities (
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      PRIMARY KEY (article_id, entity_id)
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      entity_slug TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      ticker TEXT,
      sector TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      total_assets_idr_t REAL NOT NULL,
      net_profit_idr_t REAL NOT NULL,
      dividend_idr_t REAL NOT NULL,
      equity_idr_t REAL,
      customer_deposits_or_liabilities_idr_t REAL,
      state_ownership_pct REAL NOT NULL,
      data_status TEXT NOT NULL,
      source_doc_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
      notes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      event_date TEXT NOT NULL,
      display_date TEXT NOT NULL,
      year INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      summary TEXT NOT NULL,
      impact_analysis TEXT NOT NULL,
      document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
      related_article_slug TEXT,
      related_entity_slug TEXT
    );

    CREATE TABLE IF NOT EXISTS unanswered_questions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      question TEXT NOT NULL,
      context TEXT NOT NULL,
      addressed_to TEXT NOT NULL,
      category TEXT NOT NULL,
      date_raised TEXT NOT NULL,
      status TEXT NOT NULL,
      official_note TEXT,
      related_article_slug TEXT,
      related_doc_id TEXT
    );

    CREATE TABLE IF NOT EXISTS right_of_replies (
      id TEXT PRIMARY KEY,
      respondent_name TEXT NOT NULL,
      respondent_role TEXT NOT NULL,
      response_date TEXT NOT NULL,
      related_article_slug TEXT,
      topic TEXT NOT NULL,
      editorial_claim_summary TEXT NOT NULL,
      official_response_text TEXT NOT NULL,
      editorial_verification_note TEXT NOT NULL,
      source_url TEXT,
      status TEXT NOT NULL DEFAULT 'DIPUBLIKASIKAN',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS whistleblower_reports (
      id TEXT PRIMARY KEY,
      tracking_code TEXT UNIQUE NOT NULL,
      access_pin_hash TEXT NOT NULL,
      anonymity_mode TEXT NOT NULL,
      reporter_alias TEXT,
      contact_channel TEXT,
      category TEXT NOT NULL,
      subject_entities TEXT NOT NULL,
      incident_period TEXT NOT NULL,
      estimated_value TEXT,
      title TEXT NOT NULL,
      chronology TEXT NOT NULL,
      evidence_description TEXT,
      attachment_original_name TEXT,
      attachment_stored_name TEXT,
      attachment_mime TEXT,
      attachment_size_bytes INTEGER,
      attachment_sha256 TEXT,
      risk_level TEXT NOT NULL,
      moderation_status TEXT NOT NULL DEFAULT 'DITERIMA',
      editor_public_note TEXT,
      editor_internal_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_username TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_slug);
    CREATE INDEX IF NOT EXISTS idx_articles_state ON articles(editorial_state, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(verification_status);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_entities_sector ON entities(sector);
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type, period_year DESC);
    CREATE INDEX IF NOT EXISTS idx_financials_year ON financial_records(fiscal_year, total_assets_idr_t DESC);
    CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON whistleblower_reports(moderation_status, created_at DESC);
  `);
}
