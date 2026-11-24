import type { Metadata } from "next";
import Link from "next/link";
import { Scale, History, ExternalLink } from "lucide-react";
import {
  listAllCorrections,
  listArticles,
  listRightOfReplies,
} from "@/lib/db/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { RightOfReplyFormClient } from "@/components/RightOfReplyFormClient";
import { formatIndonesianDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Hak Jawab, Bantahan Resmi & Catatan Koreksi Redaksi",
  description:
    "Ruang terbuka untuk tanggapan resmi Danantara Indonesia, pemerintah, dan pihak terkait serta log catatan koreksi transparan Bongkar Danantara.",
};

export default function HakJawabPage() {
  const replies = listRightOfReplies(false);
  const corrections = listAllCorrections();
  const articles = listArticles();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <header className="border-b-2 border-[#141414] pb-5 space-y-2">
        <div className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#581C87]">
          <Scale className="w-4 h-4" />
          AKUNTABILITAS REDAKSI &amp; KEBERIMBANGAN
        </div>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D]">
          Hak Jawab, Bantahan Resmi &amp; Log Koreksi
        </h1>
        <p className="text-base text-[#3F3D39] max-w-3xl leading-relaxed">
          Kritik tajam harus berdiri di atas integritas pembuktian. Halaman ini
          menyediakan ruang khusus bagi tanggapan resmi Danantara Indonesia,
          pemerintah, dan pihak terkait tanpa disembunyikan, sekaligus mencatat
          setiap koreksi redaksi secara terbuka.
        </p>
      </header>

      {/* Official Responses List */}
      <section className="space-y-5">
        <div className="flex items-end justify-between border-b border-[#141414] pb-2.5">
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0D0D0D]">
            Tanggapan &amp; Bantahan Resmi Tercatat ({replies.length})
          </h2>
          <a
            href="#ajukan-hak-jawab"
            className="font-data text-xs font-bold text-[#581C87] hover:underline"
          >
            Ajukan Hak Jawab ↓
          </a>
        </div>

        <div className="space-y-5">
          {replies.map((r) => (
            <article
              key={r.id}
              className="bg-white border-2 border-[#141414] border-l-8 border-l-[#581C87] p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status="BANTAHAN" size="md" />
                  <span className="font-data text-xs font-bold text-[#0D0D0D]">
                    {r.id}
                  </span>
                </div>
                <span className="font-data text-xs text-[#5F5B53]">
                  Tanggal Tanggapan: {formatIndonesianDate(r.response_date)}
                </span>
              </div>

              <div>
                <h3 className="font-editorial text-2xl font-bold text-[#0D0D0D] leading-snug">
                  {r.topic}
                </h3>
                <p className="font-data text-xs text-[#581C87] font-semibold mt-1">
                  {r.respondent_name} — {r.respondent_role}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#FAF9F6] border border-[#D6D1C6] space-y-1.5">
                  <span className="font-data text-[10px] font-bold uppercase tracking-wider text-[#9E1B1B]">
                    ISU / SOROTAN YANG DITANGGAPI
                  </span>
                  <p className="text-sm text-[#2F2E2B] leading-relaxed">
                    {r.editorial_claim_summary}
                  </p>
                </div>

                <div className="p-4 bg-[#F3E8FF]/40 border border-[#581C87] space-y-1.5">
                  <span className="font-data text-[10px] font-bold uppercase tracking-wider text-[#581C87]">
                    TANGGAPAN / BANTAHAN RESMI PIHAK TERKAIT
                  </span>
                  <p className="text-sm text-[#0D0D0D] leading-relaxed">
                    {r.official_response_text}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-[#EFECE6] border-l-4 border-[#141414] text-xs sm:text-sm text-[#1F1E1C]">
                {r.editorial_verification_note}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 font-data text-xs">
                {r.related_article_slug && (
                  <Link
                    href={`/investigasi/${r.related_article_slug}`}
                    className="font-bold text-[#9E1B1B] hover:underline"
                  >
                    Buka Artikel Investigasi Terkait →
                  </Link>
                )}
                {r.source_url && (
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#163A5F] hover:underline"
                  >
                    Tautan Sumber Resmi
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Public Corrections Ledger */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#141414] pb-2.5">
          <History className="w-5 h-5 text-[#0D0D0D]" />
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0D0D0D]">
            Catatan Koreksi &amp; Riwayat Pembaruan Redaksi ({corrections.length})
          </h2>
        </div>

        <div className="divide-y divide-[#D6D1C6] border border-[#141414] bg-white">
          {corrections.map((c) => (
            <div key={c.id} className="p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 font-data text-xs">
                <span className="font-bold text-[#9E1B1B]">
                  {c.correction_type} • {c.id}
                </span>
                <span className="text-[#5F5B53]">
                  {formatIndonesianDate(c.correction_date)} • {c.editor_name}
                </span>
              </div>
              <Link
                href={`/investigasi/${c.article_slug}`}
                className="font-editorial text-lg font-bold text-[#0D0D0D] hover:text-[#9E1B1B] block"
              >
                {c.article_title}
              </Link>
              <p className="text-sm text-[#2F2E2B]">{c.summary}</p>
              {c.previous_text && c.updated_text && (
                <div className="grid sm:grid-cols-2 gap-3 pt-1 font-data text-xs">
                  <div className="p-2.5 bg-[#FAF0F0] text-[#781111]">
                    <strong>Teks Sebelumnya:</strong> {c.previous_text}
                  </div>
                  <div className="p-2.5 bg-[#E6F4EA] text-[#14532D]">
                    <strong>Pembaruan Terverifikasi:</strong> {c.updated_text}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Submit Official Right of Reply Form */}
      <RightOfReplyFormClient
        articleOptions={articles.map((a) => ({ slug: a.slug, title: a.title }))}
      />
    </div>
  );
}
