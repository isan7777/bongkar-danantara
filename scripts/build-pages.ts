import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  listArticles,
  listDocuments,
  listEntities,
  listFinancialRecords,
  listRightOfReplies,
  listTimelineEvents,
  listUnansweredQuestions,
} from "../src/lib/db/queries";
import { closeDb } from "../src/lib/db/client";

function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportStaticData(): void {
  const outDir = path.join(process.cwd(), "public", "static-data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const archive = {
    articles: listArticles({ includeDrafts: false }),
    entities: listEntities(),
    documents: listDocuments(),
    timeline: listTimelineEvents(),
    questions: listUnansweredQuestions(),
    replies: listRightOfReplies(false),
  };

  fs.writeFileSync(
    path.join(outDir, "archive.json"),
    JSON.stringify(archive),
    "utf8"
  );

  const records = listFinancialRecords();
  const header = [
    "ID",
    "Entitas",
    "Ticker",
    "Sektor",
    "Tahun Buku",
    "Total Aset (Rp T)",
    "Laba Bersih (Rp T)",
    "Dividen (Rp T)",
    "Ekuitas (Rp T)",
    "Liabilitas/DPK (Rp T)",
    "Kepemilikan Negara (%)",
    "Status Data",
    "Catatan",
  ].join(",");

  const lines = records.map((r) =>
    [
      r.id,
      r.entity_name,
      r.ticker ?? "",
      r.sector,
      r.fiscal_year,
      r.total_assets_idr_t,
      r.net_profit_idr_t,
      r.dividend_idr_t,
      r.equity_idr_t ?? "",
      r.customer_deposits_or_liabilities_idr_t ?? "",
      r.state_ownership_pct,
      r.data_status,
      r.notes,
    ]
      .map(csvEscape)
      .join(",")
  );

  fs.writeFileSync(
    path.join(outDir, "keuangan-all.csv"),
    [header, ...lines].join("\r\n"),
    "utf8"
  );
  closeDb();
  console.log("Exported static JSON search index and CSV dataset to public/static-data/");
}

function main(): void {
  const repoRoot = process.cwd();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/bongkar-danantara";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://isan7777.github.io${basePath}`;

  // 1. Ensure PDFs and SQLite seed exist
  execSync("npm run setup", { stdio: "inherit" });

  // 2. Export static JSON archive & CSV dataset
  exportStaticData();

  // 3. Temporarily park src/app/api outside src/app so Next.js static export succeeds cleanly
  const apiDir = path.join(repoRoot, "src", "app", "api");
  const backupDir = path.join(repoRoot, ".api-export-backup");
  const nextCacheDir = path.join(repoRoot, ".next");

  let movedApi = false;
  try {
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    if (fs.existsSync(apiDir)) {
      fs.renameSync(apiDir, backupDir);
      movedApi = true;
    }
    if (fs.existsSync(nextCacheDir)) {
      fs.rmSync(nextCacheDir, { recursive: true, force: true });
    }

    execSync("npx next build", {
      stdio: "inherit",
      env: {
        ...process.env,
        GITHUB_PAGES: "1",
        NEXT_PUBLIC_STATIC_EXPORT: "1",
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_SITE_URL: siteUrl,
      },
    });

    const outDir = path.join(repoRoot, "out");
    fs.writeFileSync(path.join(outDir, ".nojekyll"), "", "utf8");
    console.log(`Static GitHub Pages build ready in ./out (basePath=${basePath})`);
  } finally {
    if (movedApi && fs.existsSync(backupDir)) {
      fs.renameSync(backupDir, apiDir);
    }
  }
}

main();
