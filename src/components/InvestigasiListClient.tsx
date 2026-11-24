"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ArticleRecord, CategoryRecord } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";
import { formatIndonesianDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";

const STATUS_OPTIONS = [
  "TERBUKTI",
  "TERDOKUMENTASI",
  "DUGAAN",
  "BELUM TERVERIFIKASI",
  "BANTAHAN",
];

interface InvestigasiListClientProps {
  articles: ArticleRecord[];
  categories: CategoryRecord[];
}

export function InvestigasiListClient({
  articles,
  categories,
}: InvestigasiListClientProps) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return articles.filter((a) => {
      if (category && a.category_slug !== category) return false;
      if (status && a.verification_status !== status) return false;
      if (query) {
        const hay = `${a.title} ${a.subtitle} ${a.excerpt} ${a.authors}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [articles, q, category, status]);

  const hasFilter = Boolean(q || category || status);

  return (
    <>
      <div className="bg-white border border-[#141414] p-4 mb-8 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label
            htmlFor="q"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Kata Kunci Judul / Isi
          </label>
          <input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Misal: dividen, Pasal 3H, BKI, Rp300 triliun..."
            className="w-full px-3 py-2 border border-[#D6D1C6] focus:border-[#141414] text-sm bg-[#F7F6F2]"
          />
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="kategori"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Kategori Investigasi
          </label>
          <select
            id="kategori"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-[#D6D1C6] text-sm bg-[#F7F6F2]"
          >
            <option value="">Semua Kategori (6 Desk)</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.code}. {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="status"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Status Bukti
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-[#D6D1C6] text-sm bg-[#F7F6F2]"
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex gap-2">
          {hasFilter ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCategory("");
                setStatus("");
              }}
              className="w-full px-3 py-2 border border-[#141414] bg-[#141414] text-white font-data text-xs font-bold uppercase hover:bg-[#9E1B1B]"
            >
              Reset Filter
            </button>
          ) : (
            <div className="w-full px-3 py-2 bg-[#EFECE6] text-center font-data text-xs text-[#5F5B53]">
              Filter Langsung
            </div>
          )}
        </div>
      </div>

      <p className="font-data text-xs uppercase tracking-wider text-[#5F5B53] mb-4">
        Menampilkan {filtered.length} dari {articles.length} laporan terpublikasi
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#D6D1C6] p-10 text-center">
          <p className="font-editorial text-xl font-bold text-[#0D0D0D]">
            Tidak ditemukan laporan yang sesuai penyaringan.
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCategory("");
              setStatus("");
            }}
            className="mt-3 font-data text-xs font-bold text-[#9E1B1B] underline"
          >
            Tampilkan seluruh laporan investigasi
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#D6D1C6] border-t border-b border-[#141414]">
          {filtered.map((art) => (
            <article
              key={art.id}
              className="py-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              <div className="lg:col-span-4">
                {art.cover_image && (
                  <Link
                    href={`/investigasi/${art.slug}`}
                    className="block border border-[#141414]"
                  >
                    <img
                      src={withBasePath(art.cover_image)}
                      alt={art.title}
                      className="w-full h-auto block"
                    />
                  </Link>
                )}
              </div>
              <div className="lg:col-span-8 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status={art.verification_status} size="md" />
                  <Link
                    href={`/kategori/${art.category_slug}`}
                    className="font-data text-xs font-bold uppercase tracking-wider text-[#9E1B1B] hover:underline"
                  >
                    {art.category_code}. {art.category_name}
                  </Link>
                  <span className="font-data text-xs text-[#5F5B53]">
                    • Terbit {formatIndonesianDate(art.published_at)} • Diperbarui{" "}
                    {formatIndonesianDate(art.updated_at)}
                  </span>
                </div>
                <Link href={`/investigasi/${art.slug}`} className="group block">
                  <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#0D0D0D] group-hover:text-[#9E1B1B] leading-tight transition-colors">
                    {art.title}
                  </h2>
                </Link>
                <p className="text-base text-[#2F2E2B] leading-relaxed">
                  {art.subtitle}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 font-data text-xs">
                  <span className="text-[#5F5B53]">
                    {art.authors} • {art.reading_time_min} menit baca
                  </span>
                  <Link
                    href={`/investigasi/${art.slug}`}
                    className="font-bold uppercase tracking-wider text-[#9E1B1B] hover:underline"
                  >
                    Baca Laporan &amp; Bukti Sumber →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
