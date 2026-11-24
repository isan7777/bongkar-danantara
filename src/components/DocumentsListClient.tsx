"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Download, ExternalLink } from "lucide-react";
import type { DocumentRecord } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";
import { formatIndonesianDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";

const DOC_TYPES = [
  "REGULASI",
  "KEPUTUSAN_PRESIDEN",
  "LAPORAN_KEUANGAN",
  "PUTUSAN_MK",
  "ANALISIS_DATA",
  "LAPORAN_TAHUNAN",
];

export function DocumentsListClient({
  documents,
}: {
  documents: DocumentRecord[];
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [year, setYear] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const yearNum = year ? Number(year) : undefined;
    return documents.filter((d) => {
      if (type && d.doc_type !== type) return false;
      if (yearNum && d.period_year !== yearNum) return false;
      if (query) {
        const hay = `${d.title} ${d.doc_number} ${d.issuer} ${d.summary} ${JSON.stringify(d.key_citations)}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [documents, q, type, year]);

  const hasFilter = Boolean(q || type || year);

  return (
    <>
      <div className="bg-white border border-[#141414] p-4 mb-8 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label
            htmlFor="doc-q"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Cari Nomor Dokumen / Pasal / Kutipan
          </label>
          <input
            id="doc-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Misal: UU No. 1, Pasal 3H, BKI, Rp9.353, Putusan MK..."
            className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
          />
        </div>
        <div className="md:col-span-3">
          <label
            htmlFor="doc-type"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Jenis Dokumen
          </label>
          <select
            id="doc-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
          >
            <option value="">Semua Jenis</option>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="doc-year"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Tahun Periode
          </label>
          <select
            id="doc-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
          >
            <option value="">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div className="md:col-span-2">
          {hasFilter ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setType("");
                setYear("");
              }}
              className="w-full px-4 py-2 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase"
            >
              Reset
            </button>
          ) : (
            <div className="w-full px-3 py-2 bg-[#EFECE6] text-center font-data text-xs text-[#5F5B53]">
              Arsip Lengkap
            </div>
          )}
        </div>
      </div>

      <p className="font-data text-xs uppercase tracking-wider text-[#5F5B53] mb-4">
        Menampilkan {filtered.length} arsip PDF terindeks
      </p>

      <div className="space-y-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-[#141414] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
          >
            <div className="lg:col-span-8 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-data text-xs font-bold px-2 py-0.5 bg-[#141414] text-white">
                  {doc.id}
                </span>
                <span className="font-data text-xs font-bold text-[#9E1B1B]">
                  {doc.doc_number}
                </span>
                <StatusBadge status={doc.verification_status} />
                <span className="font-data text-[11px] text-[#5F5B53]">
                  • {doc.doc_type} • {formatIndonesianDate(doc.published_date)}
                </span>
              </div>

              <Link
                href={`/dokumen/${doc.id}`}
                className="font-editorial text-2xl font-bold text-[#0D0D0D] hover:text-[#9E1B1B] block leading-snug"
              >
                {doc.title}
              </Link>

              <p className="text-sm text-[#2F2E2B] leading-relaxed">
                {doc.summary}
              </p>

              {doc.key_citations[0] && (
                <div className="p-3 bg-[#FAF9F6] border-l-2 border-[#163A5F] text-xs">
                  <span className="font-data font-bold text-[#163A5F]">
                    KUTIPAN KUNCI (HLM {doc.key_citations[0].page}):
                  </span>{" "}
                  <span className="italic text-[#1F1E1C]">
                    &ldquo;{doc.key_citations[0].quote}&rdquo;
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 bg-[#FAF9F6] border border-[#D6D1C6] p-4 space-y-3 font-data text-xs">
              <div className="space-y-1 text-[#3F3D39]">
                <p>
                  <strong>Penerbit:</strong> {doc.issuer}
                </p>
                <p>
                  <strong>Berkas:</strong> PDF ({doc.page_count} halaman •{" "}
                  {doc.file_size_kb} KB)
                </p>
                <p className="text-[11px] text-[#5F5B53] break-all">
                  <strong>SHA-256:</strong> {doc.sha256_hash.slice(0, 24)}...
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={`/dokumen/${doc.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#141414] hover:bg-[#9E1B1B] text-white font-bold uppercase tracking-wider transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Buka Pembaca PDF &amp; Kutipan
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={withBasePath(doc.file_path)}
                    download
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-[#141414] hover:bg-[#EFECE6] font-bold"
                  >
                    <Download className="w-3 h-3" />
                    Unduh
                  </a>
                  <a
                    href={doc.original_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-[#D6D1C6] hover:border-[#141414]"
                  >
                    Sumber
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
