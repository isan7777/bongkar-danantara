"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Newspaper, Users } from "lucide-react";
import type { TimelineEventRecord } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";

const CATEGORIES = [
  "REGULASI",
  "KELEMBAGAAN",
  "PENGANGKATAN",
  "KEUANGAN",
  "HUKUM_MK",
  "PENGAWASAN",
];

export function TimelineListClient({
  events,
}: {
  events: TimelineEventRecord[];
}) {
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const y = year ? Number(year) : undefined;
    return events.filter((ev) => {
      if (y && ev.year !== y) return false;
      if (category && ev.category !== category) return false;
      if (status && ev.verification_status !== status) return false;
      return true;
    });
  }, [events, year, category, status]);

  const hasFilter = Boolean(year || category || status);

  return (
    <>
      <div className="bg-white border border-[#141414] p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label
            htmlFor="tl-year"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Tahun
          </label>
          <select
            id="tl-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
          >
            <option value="">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="tl-cat"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Kategori Peristiwa
          </label>
          <select
            id="tl-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tl-status"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Status Bukti
          </label>
          <select
            id="tl-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
          >
            <option value="">Semua Status</option>
            <option value="TERBUKTI">TERBUKTI</option>
            <option value="TERDOKUMENTASI">TERDOKUMENTASI</option>
            <option value="BELUM TERVERIFIKASI">BELUM TERVERIFIKASI</option>
            <option value="BANTAHAN">BANTAHAN</option>
          </select>
        </div>

        <div>
          {hasFilter ? (
            <button
              type="button"
              onClick={() => {
                setYear("");
                setCategory("");
                setStatus("");
              }}
              className="w-full px-4 py-2 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase"
            >
              Reset ({filtered.length})
            </button>
          ) : (
            <div className="w-full px-3 py-2 bg-[#EFECE6] text-center font-data text-xs text-[#5F5B53]">
              {events.length} Peristiwa
            </div>
          )}
        </div>
      </div>

      <ol className="relative border-l-2 border-[#141414] ml-3 space-y-8">
        {filtered.map((ev) => (
          <li key={ev.id} className="pl-7 relative">
            <span
              className="absolute -left-[9px] top-1.5 w-4 h-4 bg-[#9E1B1B] border-2 border-[#F7F6F2]"
              aria-hidden="true"
            />
            <div className="bg-white border border-[#141414] p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-data text-xs font-bold uppercase px-2 py-0.5 bg-[#141414] text-white">
                    {ev.display_date}
                  </span>
                  <span className="font-data text-[11px] font-bold uppercase text-[#9E1B1B]">
                    {ev.category}
                  </span>
                </div>
                <StatusBadge status={ev.verification_status} size="md" />
              </div>

              <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D] leading-snug">
                {ev.title}
              </h2>

              <p className="text-sm sm:text-base text-[#1F1E1C] leading-relaxed">
                {ev.summary}
              </p>

              <div className="bg-[#FAF9F6] border-l-4 border-[#163A5F] p-3.5 text-sm text-[#2F2E2B]">
                <strong className="font-data text-[11px] uppercase tracking-wider text-[#163A5F] block mb-1">
                  DAMPAK TATA KELOLA &amp; PENGAWASAN:
                </strong>
                {ev.impact_analysis}
              </div>

              <div className="pt-2 border-t border-[#EFECE6] flex flex-wrap items-center gap-4 font-data text-xs">
                {ev.document_id && (
                  <Link
                    href={`/dokumen/${ev.document_id}`}
                    className="inline-flex items-center gap-1 font-bold text-[#163A5F] hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Dokumen: {ev.document_id}
                  </Link>
                )}
                {ev.related_article_slug && (
                  <Link
                    href={`/investigasi/${ev.related_article_slug}`}
                    className="inline-flex items-center gap-1 font-bold text-[#9E1B1B] hover:underline"
                  >
                    <Newspaper className="w-3.5 h-3.5" />
                    Baca Laporan Investigasi
                  </Link>
                )}
                {ev.related_entity_slug && (
                  <Link
                    href={`/database/${ev.related_entity_slug}`}
                    className="inline-flex items-center gap-1 text-[#3F3D39] hover:text-[#0D0D0D] hover:underline"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Profil Entitas Terkait
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
