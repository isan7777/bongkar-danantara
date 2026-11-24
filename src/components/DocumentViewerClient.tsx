"use client";

import { useState } from "react";
import { Download, ExternalLink, Search, FileText, BookOpen, Hash } from "lucide-react";
import type { DocumentRecord } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";
import { formatIndonesianDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";

interface DocumentViewerClientProps {
  document: DocumentRecord;
}

export function DocumentViewerClient({ document: doc }: DocumentViewerClientProps) {
  const [activePage, setActivePage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [textQuery, setTextQuery] = useState("");

  const resolvedFilePath = withBasePath(doc.file_path);
  const pdfSrc = `${resolvedFilePath}#page=${activePage}`;
  const filteredPages = textQuery.trim()
    ? doc.pages_text.filter(
        (p) =>
          p.heading.toLowerCase().includes(textQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(textQuery.toLowerCase())
      )
    : doc.pages_text;

  return (
    <div className="space-y-8">
      {/* Header Metadata Sheet */}
      <header className="bg-white border-2 border-[#141414] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 bg-[#141414] text-white font-data text-xs font-bold">
              {doc.id}
            </span>
            <span className="px-2.5 py-1 bg-[#EFECE6] border border-[#141414] font-data text-xs font-bold">
              {doc.doc_type}
            </span>
            <StatusBadge status={doc.verification_status} size="md" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={resolvedFilePath}
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9E1B1B] hover:bg-[#781111] text-white font-data text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh PDF ({doc.file_size_kb} KB)
            </a>
            <a
              href={doc.original_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#141414] bg-white hover:bg-[#EFECE6] font-data text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Portal Sumber Asli
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <h1 className="font-editorial text-2xl sm:text-4xl font-extrabold text-[#0D0D0D] leading-tight">
          {doc.title}
        </h1>
        <p className="text-base text-[#2F2E2B] leading-relaxed">{doc.summary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-[#D6D1C6] font-data text-xs">
          <div>
            <span className="block text-[10px] uppercase text-[#5F5B53]">
              NOMOR DOKUMEN
            </span>
            <span className="font-bold text-[#0D0D0D]">{doc.doc_number}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#5F5B53]">
              PENERBIT / OTORITAS
            </span>
            <span className="font-semibold text-[#0D0D0D]">{doc.issuer}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#5F5B53]">
              TANGGAL / HALAMAN
            </span>
            <span className="font-semibold text-[#0D0D0D]">
              {formatIndonesianDate(doc.published_date)} ({doc.page_count} hlm)
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#5F5B53]">
              INTEGRITAS SHA-256
            </span>
            <span
              className="inline-flex items-center gap-1 font-mono text-[11px] text-[#163A5F] break-all"
              title={doc.sha256_hash}
            >
              <Hash className="w-3 h-3 shrink-0" />
              {doc.sha256_hash.slice(0, 18)}...
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Reader Pane */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-data text-xs font-bold uppercase ${
                  viewMode === "pdf"
                    ? "bg-[#9E1B1B] text-white"
                    : "bg-[#262522] text-[#D8D4CB] hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Pembaca PDF Asli
              </button>
              <button
                type="button"
                onClick={() => setViewMode("text")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-data text-xs font-bold uppercase ${
                  viewMode === "text"
                    ? "bg-[#9E1B1B] text-white"
                    : "bg-[#262522] text-[#D8D4CB] hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Transkrip &amp; Cari Teks
              </button>
            </div>

            <div className="flex items-center gap-2 font-data text-xs">
              <span className="text-[#C7C2B6]">Halaman aktif:</span>
              {Array.from({ length: doc.page_count }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePage(p)}
                    className={`w-7 h-7 border text-center font-bold ${
                      activePage === p
                        ? "bg-[#9E1B1B] border-[#9E1B1B] text-white"
                        : "bg-[#262522] border-[#52504A] text-[#E8E4DC] hover:border-white"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          </div>

          {viewMode === "pdf" ? (
            <div className="bg-white border-2 border-[#141414]">
              <iframe
                key={pdfSrc}
                src={pdfSrc}
                title={doc.title}
                className="w-full h-[760px] bg-[#EFECE6]"
              />
              <div className="px-4 py-2.5 bg-[#EFECE6] border-t border-[#D6D1C6] flex flex-wrap items-center justify-between gap-2 font-data text-xs text-[#3F3D39]">
                <span>
                  Menampilkan arsip PDF resmi halaman {activePage} dari{" "}
                  {doc.page_count}.
                </span>
                <a
                  href={resolvedFilePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#9E1B1B] hover:underline"
                >
                  Buka PDF di Tab Baru →
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-[#141414] p-5 space-y-5">
              <div className="flex items-center gap-2 border border-[#141414] bg-[#F7F6F2] px-3 py-2">
                <Search className="w-4 h-4 text-[#9E1B1B]" />
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Cari frasa, pasal, atau angka di dalam teks dokumen ini..."
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>

              {filteredPages.length === 0 ? (
                <p className="text-sm text-[#5F5B53] py-6 text-center">
                  Frasa &ldquo;{textQuery}&rdquo; tidak ditemukan dalam transkrip
                  dokumen ini.
                </p>
              ) : (
                <div className="space-y-6">
                  {filteredPages.map((p) => (
                    <div
                      key={p.page}
                      className={`p-5 border ${
                        activePage === p.page
                          ? "border-[#9E1B1B] bg-[#FAF0F0]/40"
                          : "border-[#D6D1C6] bg-[#FAF9F6]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#D6D1C6]">
                        <span className="font-data text-xs font-bold text-[#9E1B1B]">
                          {p.heading}
                        </span>
                        <span className="font-data text-[11px] px-2 py-0.5 bg-[#141414] text-white">
                          HLM {p.page}
                        </span>
                      </div>
                      <div className="space-y-3 text-sm text-[#1F1E1C] leading-relaxed whitespace-pre-line">
                        {p.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Citation & Page Reference Inspector */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          <div className="bg-white border-2 border-[#141414] p-5 space-y-4">
            <div className="border-b border-[#D6D1C6] pb-3">
              <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
                PEMERIKSA KUTIPAN &amp; NOMOR HALAMAN
              </p>
              <h2 className="font-editorial text-xl font-bold text-[#0D0D0D] mt-0.5">
                Kutipan Kunci dalam Dokumen ({doc.key_citations.length})
              </h2>
            </div>

            <div className="space-y-4">
              {doc.key_citations.map((cit, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#FAF9F6] border border-[#D6D1C6] border-l-4 border-l-[#9E1B1B] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-data text-[11px] font-bold text-[#0D0D0D]">
                      {cit.section}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePage(cit.page);
                        setViewMode("text");
                      }}
                      className="px-2 py-0.5 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-[10px] font-bold transition-colors"
                    >
                      LOMPAT HLM {cit.page}
                    </button>
                  </div>
                  <blockquote className="text-sm italic text-[#1F1E1C] leading-relaxed">
                    &ldquo;{cit.quote}&rdquo;
                  </blockquote>
                  <p className="text-xs text-[#5F5B53] border-t border-[#E5E1D8] pt-2">
                    <strong className="text-[#0D0D0D]">Catatan Redaksi:</strong>{" "}
                    {cit.analysis_note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
