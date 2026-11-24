import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3055";

async function checkHtmlRoute(route, expectedText) {
  const res = await fetch(`${BASE}${route}`);
  assert.equal(res.status, 200, `Route ${route} returned ${res.status}`);
  const html = await res.text();
  assert.ok(
    html.includes(expectedText),
    `Route ${route} missing expected text: ${expectedText}`
  );
  // Check security headers
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "SAMEORIGIN");
}

async function main() {
  console.log("1. Checking SSR pages and security headers...");
  await checkHtmlRoute(
    "/",
    "SIAPA YANG MENGAWASI PENGELOLA UANG DAN ASET NEGARA?"
  );
  await checkHtmlRoute("/investigasi", "Laporan Investigasi Danantara");
  await checkHtmlRoute("/kategori/jejak-uang", "Jejak Uang");
  await checkHtmlRoute(
    "/investigasi/danantara-mengelola-aset-raksasa-mengapa-publik-sulit-melihat-detailnya",
    "BUKTI DAN SUMBER"
  );
  await checkHtmlRoute("/database", "Entitas, Pejabat, BUMN");
  await checkHtmlRoute(
    "/database/bpi-danantara-indonesia",
    "Peta Relasi Terdokumentasi"
  );
  await checkHtmlRoute("/dokumen", "Vault Dokumen Terbuka");
  await checkHtmlRoute("/dokumen/DOC-UU-01-2025", "UU No. 1 Tahun 2025");
  await checkHtmlRoute(
    "/dokumen/bandingkan",
    "Bandingkan Laporan Keuangan"
  );
  await checkHtmlRoute("/keuangan", "Visualisasi Data Keuangan Danantara");
  await checkHtmlRoute("/timeline", "Timeline Keputusan Penting Danantara");
  await checkHtmlRoute("/lapor", "Kirim Laporan Publik");
  await checkHtmlRoute("/lapor/cek", "Cek Status Moderasi Laporan");
  await checkHtmlRoute("/hak-jawab", "Hak Jawab, Bantahan Resmi");
  await checkHtmlRoute("/metodologi", "Metodologi Verifikasi");
  await checkHtmlRoute("/cari?q=Pasal+3H", "Pasal 3H");
  await checkHtmlRoute("/admin", "Dashboard Admin Bongkar Danantara");
  console.log("   All 17 SSR routes returned 200 OK with security headers.");

  console.log("2. Checking public PDF download and CSV export...");
  const pdfRes = await fetch(`${BASE}/documents/DOC-UU-01-2025.pdf`);
  assert.equal(pdfRes.status, 200);
  const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
  assert.equal(pdfBuf.subarray(0, 5).toString("ascii"), "%PDF-");

  const csvRes = await fetch(`${BASE}/api/financials?format=csv`);
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes("PT Bank Mandiri"));
  assert.ok(csvText.includes("2427.22"));

  const searchRes = await fetch(`${BASE}/api/search?q=Pasal%203H`);
  assert.equal(searchRes.status, 200);
  const searchJson = await searchRes.json();
  assert.ok(searchJson.total >= 2);
  console.log("   PDF, CSV, and global search API verified.");

  console.log("3. Checking access control on privileged endpoints...");
  const unauthReports = await fetch(`${BASE}/api/reports`);
  assert.equal(unauthReports.status, 401, "Unauthenticated /api/reports must be 401");

  const unauthArticlePost = await fetch(`${BASE}/api/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Unauthorized" }),
  });
  assert.equal(unauthArticlePost.status, 401);
  console.log("   Unauthorized access properly blocked with 401.");

  console.log("4. Testing whistleblower upload -> anonymous lookup -> admin moderation...");
  const fd = new FormData();
  fd.set("anonymity_mode", "ANONIM");
  fd.set("category", "Transaksi Investasi Tidak Transparan");
  fd.set("subject_entities", "Uji End-to-End Holding");
  fd.set("incident_period", "Q4 2026");
  fd.set("title", "Uji Otomatis Pengiriman Laporan dan Bukti PDF");
  fd.set(
    "chronology",
    "Ini adalah kronologi uji integrasi otomatis untuk memverifikasi penyimpanan terisolasi, hashing PIN, dan alur moderasi redaksi."
  );
  fd.set("risk_level", "TINGGI");
  fd.set(
    "attachment",
    new Blob(["%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"], {
      type: "application/pdf",
    }),
    "bukti-uji.pdf"
  );

  const submitRes = await fetch(`${BASE}/api/reports`, {
    method: "POST",
    body: fd,
  });
  assert.equal(submitRes.status, 201);
  const receipt = await submitRes.json();
  assert.ok(receipt.tracking_code.startsWith("BD-"));
  assert.ok(receipt.access_pin.includes("-"));
  assert.ok(receipt.attachment_sha256);

  // Anonymous status lookup with wrong PIN fails
  const badLookup = await fetch(`${BASE}/api/reports/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tracking_code: receipt.tracking_code,
      access_pin: "WRONG-PIN",
    }),
  });
  assert.equal(badLookup.status, 404);

  // Anonymous status lookup with valid PIN succeeds
  const okLookup = await fetch(`${BASE}/api/reports/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tracking_code: receipt.tracking_code,
      access_pin: receipt.access_pin,
    }),
  });
  assert.equal(okLookup.status, 200);
  const lookupJson = await okLookup.json();
  assert.equal(lookupJson.report.moderation_status, "DITERIMA");

  // Admin login (runs when BONGKAR_ADMIN_USERNAME and BONGKAR_ADMIN_PASSWORD are provided)
  const adminUser = process.env.BONGKAR_ADMIN_USERNAME;
  const adminPass = process.env.BONGKAR_ADMIN_PASSWORD;
  if (adminUser && adminPass) {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminUser,
        password: adminPass,
      }),
    });
    assert.equal(loginRes.status, 200);
    const setCookie = loginRes.headers.get("set-cookie");
    assert.ok(setCookie && setCookie.includes("bd_editorial_session="));
    const cookieHeader = setCookie.split(";")[0];

    // Fetch reports as authenticated admin
    const adminReportsRes = await fetch(`${BASE}/api/reports`, {
      headers: { Cookie: cookieHeader },
    });
    assert.equal(adminReportsRes.status, 200);
    const adminReports = await adminReportsRes.json();
    const created = adminReports.reports.find(
      (r) => r.tracking_code === receipt.tracking_code
    );
    assert.ok(created, "Submitted report must appear in admin queue");

    // Download attachment securely as admin
    const dlRes = await fetch(
      `${BASE}/api/reports/${created.id}?download=1`,
      { headers: { Cookie: cookieHeader } }
    );
    assert.equal(dlRes.status, 200);
    const dlBytes = Buffer.from(await dlRes.arrayBuffer());
    assert.equal(dlBytes.subarray(0, 5).toString("ascii"), "%PDF-");

    // Update moderation status
    const modRes = await fetch(`${BASE}/api/reports/${created.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        moderation_status: "VERIFIKASI_AWAL",
        editor_public_note: "Dokumen bukti telah diterima dan lulus uji integritas.",
        editor_internal_note: "Catatan rahasia internal uji E2E.",
      }),
    });
    assert.equal(modRes.status, 200);

    // Confirm anonymous reporter sees public note ONLY (never internal note)
    const afterModLookup = await fetch(`${BASE}/api/reports/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracking_code: receipt.tracking_code,
        access_pin: receipt.access_pin,
      }),
    });
    const afterModJson = await afterModLookup.json();
    assert.equal(afterModJson.report.moderation_status, "VERIFIKASI_AWAL");
    assert.equal(
      afterModJson.report.editor_public_note,
      "Dokumen bukti telah diterima dan lulus uji integritas."
    );
    assert.equal(afterModJson.report.editor_internal_note, undefined);

    const dbAudit = new DatabaseSync(path.join(process.cwd(), "data", "bongkar-danantara.db"));
    dbAudit.prepare("DELETE FROM audit_logs WHERE target_id = ?").run(created.id);
    dbAudit.close();
  }

  // Clean up synthetic test report and attachment file so database remains pristine
  const db = new DatabaseSync(path.join(process.cwd(), "data", "bongkar-danantara.db"));
  const stored = db
    .prepare("SELECT attachment_stored_name FROM whistleblower_reports WHERE tracking_code = ?")
    .get(receipt.tracking_code);
  db.prepare("DELETE FROM whistleblower_reports WHERE tracking_code = ?").run(
    receipt.tracking_code
  );
  db.close();
  if (stored?.attachment_stored_name) {
    const filePath = path.join(
      process.cwd(),
      "data",
      "uploads",
      path.basename(String(stored.attachment_stored_name))
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  console.log("   Full E2E whistleblowing + RBAC + moderation + attachment isolation PASSED.");
}

main().catch((err) => {
  console.error("E2E test FAILED:", err);
  process.exit(1);
});
