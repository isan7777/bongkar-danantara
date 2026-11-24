import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  getArticleDetail,
  getDocumentByIdOrSlug,
  getEntityDetail,
  getPlatformStats,
  globalSearch,
  listArticles,
  listCategories,
  listDocuments,
  listEntities,
  listFinancialRecords,
  listRightOfReplies,
  listTimelineEvents,
  listUnansweredQuestions,
} from "../src/lib/db/queries";
import {
  hashSecret,
  signSessionToken,
  verifySecret,
  verifySessionToken,
} from "../src/lib/auth";
import {
  checkRateLimit,
  validateUploadMagicBytes,
} from "../src/lib/security";

test("Database seed integrity: categories, articles, mandatory sources, and stats", () => {
  const categories = listCategories();
  assert.equal(categories.length, 6, "Must have all 6 investigative categories");

  const articles = listArticles();
  assert.ok(articles.length >= 8, "Must have at least 8 published articles");

  for (const art of articles) {
    const detail = getArticleDetail(art.slug);
    assert.ok(detail, `Article detail must load for ${art.slug}`);
    assert.ok(
      detail.sources.length >= 1,
      `Every investigative article (${art.slug}) must have at least 1 BUKTI DAN SUMBER entry`
    );
    assert.ok(detail.article.methodology.length > 20);
  }

  const stats = getPlatformStats();
  assert.ok(stats.documentsTotal >= 7);
  assert.ok(stats.entitiesTotal >= 15);
  assert.ok(stats.relationsTotal >= 15);
});

test("Archival PDF files exist on disk, start with %PDF-, and match SHA-256 in SQLite", () => {
  const docs = listDocuments();
  assert.ok(docs.length >= 7);

  for (const doc of docs) {
    const rel = doc.file_path.replace(/^\//, "");
    const absPath = path.join(process.cwd(), "public", rel);
    assert.ok(fs.existsSync(absPath), `Missing PDF file: ${absPath}`);
    const bytes = fs.readFileSync(absPath);
    assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
    const actualSha = crypto.createHash("sha256").update(bytes).digest("hex");
    assert.equal(
      actualSha,
      doc.sha256_hash,
      `SHA-256 mismatch for ${doc.id}`
    );
    const loaded = getDocumentByIdOrSlug(doc.id);
    assert.ok(loaded && loaded.key_citations.length >= 1);
  }
});

test("Financial arithmetic consistency: 7 flagship BUMN FY 2024 assets and dividends", () => {
  const fy2024 = listFinancialRecords(2024);
  assert.equal(fy2024.length, 7);

  const totalAssets = Number(
    fy2024.reduce((s, r) => s + r.total_assets_idr_t, 0).toFixed(2)
  );
  assert.equal(totalAssets, 9353.4);

  const totalDividends = Number(
    fy2024.reduce((s, r) => s + r.dividend_idr_t, 0).toFixed(2)
  );
  assert.equal(totalDividends, 81.7);

  const fy2023 = listFinancialRecords(2023);
  assert.equal(fy2023.length, 7);
});

test("Entity database filtering, profile relations, timeline, questions, and replies", () => {
  const banks = listEntities({ sector: "Perbankan" });
  assert.equal(banks.length, 3);

  const over1000T = listEntities({ minValue: 1000 });
  assert.ok(over1000T.length >= 7);

  const danantara = getEntityDetail("bpi-danantara-indonesia");
  assert.ok(danantara);
  assert.ok(danantara.relations.length >= 7);
  assert.ok(danantara.articles.length >= 4);

  assert.ok(listTimelineEvents().length >= 9);
  assert.ok(listUnansweredQuestions().length >= 7);
  assert.ok(listRightOfReplies().length >= 4);
});

test("Global search returns cross-domain hits", () => {
  const res = globalSearch("Pasal 3H");
  assert.ok(res.articles.length >= 1);
  assert.ok(res.documents.length >= 1);

  const resBki = globalSearch("BKI");
  assert.ok(resBki.entities.length >= 1);
  assert.ok(resBki.documents.length >= 1);
});

test("Auth cryptography, HMAC session tokens, magic bytes, and rate limiting", () => {
  const hash = hashSecret("TestSecret#2026");
  assert.equal(verifySecret("TestSecret#2026", hash), true);
  assert.equal(verifySecret("WrongPass", hash), false);

  const token = signSessionToken({
    userId: "ADM-01",
    username: "editor",
    displayName: "Editor",
    role: "EDITOR_IN_CHIEF",
  });
  const verified = verifySessionToken(token);
  assert.ok(verified && verified.username === "editor");

  // Tampered signature must fail
  assert.equal(verifySessionToken(`${token}tampered`), null);

  // Magic-byte validation
  assert.equal(
    validateUploadMagicBytes(Buffer.from("%PDF-1.7\nbody"), ".pdf"),
    true
  );
  assert.equal(
    validateUploadMagicBytes(Buffer.from("<script>alert(1)</script>"), ".pdf"),
    false
  );
  assert.equal(
    validateUploadMagicBytes(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ".png"),
    true
  );
  assert.equal(
    validateUploadMagicBytes(Buffer.from("plain text report"), ".txt"),
    true
  );
  assert.equal(
    validateUploadMagicBytes(Buffer.from([0x41, 0x00, 0x42]), ".txt"),
    false
  );

  // Rate limit
  const key = `test-rl-${Date.now()}`;
  assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 10_000).allowed, false);
});

test("RSC serialization boundary: all query results return plain Object.prototype records", () => {
  const samples: unknown[] = [
    ...listCategories(),
    ...listArticles(),
    ...listEntities(),
    ...listDocuments(),
    ...listFinancialRecords(),
    ...listTimelineEvents(),
    ...listUnansweredQuestions(),
    ...listRightOfReplies(),
  ];
  assert.ok(samples.length > 30);
  for (const item of samples) {
    assert.equal(
      Object.getPrototypeOf(item),
      Object.prototype,
      "node:sqlite null-prototype row leaked past query boundary"
    );
  }
});

test("Zero Emoji Policy compliance across src/ and scripts/", () => {
  const emojiRegex = /[\p{Extended_Pictographic}]/u;
  const roots = [
    path.join(process.cwd(), "src"),
    path.join(process.cwd(), "scripts"),
  ];

  function scan(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (/\.(ts|tsx|css|md)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf8");
        assert.equal(
          emojiRegex.test(content),
          false,
          `Emoji detected in ${full}`
        );
      }
    }
  }

  for (const r of roots) {
    scan(r);
  }
});
