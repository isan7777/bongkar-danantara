"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { DocumentRecord, FinancialRecord } from "@/types/domain";
import { formatTrillionIdr, formatPercent } from "@/lib/format";
import { withBasePath } from "@/lib/paths";
import { StatusBadge } from "./StatusBadge";

interface CompareReportsClientProps {
  financials: FinancialRecord[];
  documents: DocumentRecord[];
}

const REGULATORY_DIFFS = [
  {
    aspect: "Arsitektur Regulator vs Operator",
    uu1: "Kementerian BUMN sekaligus berperan sebagai pengawas (Ketua Dewas Danantara) sementara pejabat kementerian duduk di Badan Pelaksana.",
    uu16: "Membentuk Badan Pengaturan BUMN (BP BUMN) sebagai regulator murni pemegang 1% Saham Seri A Dwiwarna, terpisah dari Danantara sebagai operator superholding.",
    note: "Menjawab kritik rangkap fungsi kelembagaan secara normatif, namun perlu uji praktik independensi di lapangan.",
  },
  {
    aspect: "Status Kerugian Korporasi & BJR",
    uu1: "Pasal 3H(2) & 4B memisahkan kerugian Danantara/BUMN dari kerugian negara, memicu gugatan uji materi di MK.",
    uu16: "Memperkuat prinsip Business Judgment Rule (BJR) bagi organ pengelola sepanjang diputuskan dengan iktikad baik dan tanpa konflik kepentingan.",
    note: "Gugatan MK Perkara 38, 43, 44, dan 80/PUU-XXIII/2025 dinyatakan kehilangan objek pada 30 Okt 2025 sebelum pokok norma diputus.",
  },
  {
    aspect: "Kepemilikan & Pengelolaan Aset",
    uu1: "Modal awal minimal Rp1.000 T; inbreng saham BUMN ke Holding Operasional (PT BKI via PP 15/2025).",
    uu16: "Menegaskan kendali strategis negara pada 1% Saham Seri A Dwiwarna sementara pengelolaan nilai ekonomi dan dividen berada di Danantara.",
    note: "Pengawasan dividen bergeser dari penerimaan langsung APBN ke pengawasan kinerja portofolio Danantara.",
  },
  {
    aspect: "Keterbukaan Transaksi & Audit",
    uu1: "Tidak merinci standar keterbukaan daftar proyek investasi per transaksi maupun beneficial ownership mitra swasta.",
    uu16: "Belum memuat ketentuan teknis publikasi daftar proyek, remunerasi penasihat global, atau kewajiban LHKPN terbuka non-penyelenggara negara.",
    note: "Menjadi titik utama yang diuji pada laporan keuangan konsolidasian perdana November 2026.",
  },
];

export function CompareReportsClient({
  financials,
  documents,
}: CompareReportsClientProps) {
  const [tab, setTab] = useState<"financial" | "regulation" | "documents">(
    "financial"
  );
  const [leftDocId, setLeftDocId] = useState<string>(
    documents[0]?.id || "DOC-UU-01-2025"
  );
  const [rightDocId, setRightDocId] = useState<string>(
    documents[5]?.id || documents[1]?.id || "DOC-UU-16-2025"
  );

  const financialRows = useMemo(() => {
    const bySlug = new Map<
      string,
      {
        entity_name: string;
        entity_slug: string;
        sector: string;
        y2023?: FinancialRecord;
        y2024?: FinancialRecord;
      }
    >();
    for (const r of financials) {
      const existing = bySlug.get(r.entity_slug) || {
        entity_name: r.entity_name,
        entity_slug: r.entity_slug,
        sector: r.sector,
      };
      if (r.fiscal_year === 2023) existing.y2023 = r;
      if (r.fiscal_year === 2024) existing.y2024 = r;
      bySlug.set(r.entity_slug, existing);
    }
    return Array.from(bySlug.values()).sort(
      (a, b) =>
        (b.y2024?.total_assets_idr_t ?? 0) - (a.y2024?.total_assets_idr_t ?? 0)
    );
  }, [financials]);

  const leftDoc = documents.find((d) => d.id === leftDocId) || documents[0];
  const rightDoc = documents.find((d) => d.id === rightDocId) || documents[1];

  function renderDelta(prev?: number, curr?: number) {
    if (prev === undefined || curr === undefined || prev === 0) {
      return <span className="text-[#5F5B53]">—</span>;
    }
    const diff = curr - prev;
    const pct = (diff / prev) * 100;
    if (Math.abs(pct) < 0.05) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[#5F5B53]">
          <Minus className="w-3 h-3" /> 0,0%
        </span>
      );
    }
    const isPositive = diff > 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 font-bold ${
          isPositive ? "text-[#14532D]" : "text-[#9E1B1B]"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5" />
        )}
        {isPositive ? "+" : ""}
        {formatPercent(pct)}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#141414] pb-4">
        <button
          type="button"
          onClick={() => setTab("financial")}
          className={`px-4 py-2.5 font-data text-xs font-bold uppercase tracking-wider border ${
            tab === "financial"
              ? "bg-[#9E1B1B] text-white border-[#9E1B1B]"
              : "bg-white text-[#0D0D0D] border-[#141414] hover:bg-[#EFECE6]"
          }`}
        >
          1. Neraca &amp; Dividen 7 BUMN (2023 vs 2024)
        </button>
        <button
          type="button"
          onClick={() => setTab("regulation")}
          className={`px-4 py-2.5 font-data text-xs font-bold uppercase tracking-wider border ${
            tab === "regulation"
              ? "bg-[#9E1B1B] text-white border-[#9E1B1B]"
              : "bg-white text-[#0D0D0D] border-[#141414] hover:bg-[#EFECE6]"
          }`}
        >
          2. Revisi Regulasi (UU 1/2025 vs UU 16/2025)
        </button>
        <button
          type="button"
          onClick={() => setTab("documents")}
          className={`px-4 py-2.5 font-data text-xs font-bold uppercase tracking-wider border ${
            tab === "documents"
              ? "bg-[#9E1B1B] text-white border-[#9E1B1B]"
              : "bg-white text-[#0D0D0D] border-[#141414] hover:bg-[#EFECE6]"
          }`}
        >
          3. Bandingkan 2 Dokumen Arsip Berdampingan
        </button>
      </div>

      {/* Tab 1: Financial Period Comparison */}
      {tab === "financial" && (
        <div className="bg-white border-2 border-[#141414] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-white font-data text-[11px] uppercase">
                <th className="p-3">Entitas BUMN</th>
                <th className="p-3">Aset 2023</th>
                <th className="p-3">Aset 2024</th>
                <th className="p-3">Perubahan Aset</th>
                <th className="p-3">Laba 2023</th>
                <th className="p-3">Laba 2024</th>
                <th className="p-3">Perubahan Laba</th>
                <th className="p-3">Dividen 2023 → 2024</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D1C6] text-xs font-data">
              {financialRows.map((row) => (
                <tr key={row.entity_slug} className="hover:bg-[#FAF9F6]">
                  <td className="p-3 font-sans">
                    <Link
                      href={`/database/${row.entity_slug}`}
                      className="font-bold text-sm text-[#0D0D0D] hover:text-[#9E1B1B]"
                    >
                      {row.entity_name}
                    </Link>
                    <span className="block font-data text-[10px] text-[#5F5B53]">
                      {row.sector}
                    </span>
                  </td>
                  <td className="p-3">
                    {formatTrillionIdr(row.y2023?.total_assets_idr_t)}
                  </td>
                  <td className="p-3 font-bold">
                    {formatTrillionIdr(row.y2024?.total_assets_idr_t)}
                  </td>
                  <td className="p-3">
                    {renderDelta(
                      row.y2023?.total_assets_idr_t,
                      row.y2024?.total_assets_idr_t
                    )}
                  </td>
                  <td className="p-3">
                    {formatTrillionIdr(row.y2023?.net_profit_idr_t)}
                  </td>
                  <td className="p-3 font-bold">
                    {formatTrillionIdr(row.y2024?.net_profit_idr_t)}
                  </td>
                  <td className="p-3">
                    {renderDelta(
                      row.y2023?.net_profit_idr_t,
                      row.y2024?.net_profit_idr_t
                    )}
                  </td>
                  <td className="p-3">
                    <span>
                      {formatTrillionIdr(row.y2023?.dividend_idr_t)} →{" "}
                      <strong className="text-[#9E1B1B]">
                        {formatTrillionIdr(row.y2024?.dividend_idr_t)}
                      </strong>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Statutory Diff */}
      {tab === "regulation" && (
        <div className="space-y-4">
          {REGULATORY_DIFFS.map((item) => (
            <div
              key={item.aspect}
              className="bg-white border-2 border-[#141414] overflow-hidden"
            >
              <div className="bg-[#141414] text-white px-5 py-3 font-editorial text-lg font-bold">
                {item.aspect}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#D6D1C6]">
                <div className="p-5 space-y-2">
                  <span className="font-data text-[11px] font-bold uppercase text-[#9E1B1B]">
                    UU NO. 1 TAHUN 2025 (24 FEB 2025)
                  </span>
                  <p className="text-sm text-[#1F1E1C] leading-relaxed">
                    {item.uu1}
                  </p>
                </div>
                <div className="p-5 space-y-2 bg-[#FAF9F6]">
                  <span className="font-data text-[11px] font-bold uppercase text-[#163A5F]">
                    UU NO. 16 TAHUN 2025 (6 OKT 2025)
                  </span>
                  <p className="text-sm text-[#1F1E1C] leading-relaxed">
                    {item.uu16}
                  </p>
                </div>
              </div>
              <div className="px-5 py-3 bg-[#EFECE6] border-t border-[#D6D1C6] text-xs font-data text-[#2F2E2B]">
                <strong>CATATAN PENGAWASAN:</strong> {item.note}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Side-by-Side Document Selector */}
      {tab === "documents" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-[#141414] p-4">
            <div>
              <label
                htmlFor="left-doc"
                className="block font-data text-[11px] font-bold uppercase text-[#9E1B1B] mb-1"
              >
                Dokumen Panel Kiri
              </label>
              <select
                id="left-doc"
                value={leftDocId}
                onChange={(e) => setLeftDocId(e.target.value)}
                className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doc_number} ({d.period_year}) — {d.title.slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="right-doc"
                className="block font-data text-[11px] font-bold uppercase text-[#163A5F] mb-1"
              >
                Dokumen Panel Kanan
              </label>
              <select
                id="right-doc"
                value={rightDocId}
                onChange={(e) => setRightDocId(e.target.value)}
                className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doc_number} ({d.period_year}) — {d.title.slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[leftDoc, rightDoc].map((doc, idx) =>
              doc ? (
                <div
                  key={`${doc.id}-${idx}`}
                  className="bg-white border-2 border-[#141414] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#D6D1C6] pb-3">
                    <span className="font-data text-xs font-bold text-[#9E1B1B]">
                      {doc.doc_number} • {doc.period_year}
                    </span>
                    <StatusBadge status={doc.verification_status} />
                  </div>
                  <h3 className="font-editorial text-xl font-bold text-[#0D0D0D]">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-[#2F2E2B]">{doc.summary}</p>

                  <div className="space-y-3 pt-2">
                    <p className="font-data text-[11px] font-bold uppercase tracking-wider text-[#5F5B53]">
                      Kutipan Kunci Terverifikasi
                    </p>
                    {doc.key_citations.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3 bg-[#FAF9F6] border-l-2 border-[#141414] text-xs space-y-1"
                      >
                        <p className="font-data font-bold text-[#0D0D0D]">
                          Hlm. {c.page} — {c.section}
                        </p>
                        <p className="italic text-[#2F2E2B]">
                          &ldquo;{c.quote}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#D6D1C6] flex justify-between font-data text-xs">
                    <Link
                      href={`/dokumen/${doc.id}`}
                      className="font-bold text-[#9E1B1B] hover:underline"
                    >
                      Buka PDF Penuh →
                    </Link>
                    <a
                      href={withBasePath(doc.file_path)}
                      download
                      className="text-[#163A5F] hover:underline"
                    >
                      Unduh PDF
                    </a>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
