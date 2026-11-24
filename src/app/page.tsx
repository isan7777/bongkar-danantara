import Link from "next/link";
import {
  ArrowRight,
  FileText,
  HelpCircle,
  ShieldAlert,
  Clock,
  Scale,
  Database,
  ExternalLink,
} from "lucide-react";
import {
  getPlatformStats,
  listArticles,
  listCategories,
  listDocuments,
  listFinancialRecords,
  listRightOfReplies,
  listTimelineEvents,
  listUnansweredQuestions,
} from "@/lib/db/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { FinancialCharts } from "@/components/FinancialCharts";
import {
  formatIndonesianDate,
  getQuestionStatusStyles,
} from "@/lib/format";
import { withBasePath } from "@/lib/paths";

export default function HomePage() {
  const articles = listArticles({ limit: 8 });
  const categories = listCategories();
  const documents = listDocuments().slice(0, 4);
  const financials = listFinancialRecords();
  const timeline = listTimelineEvents().slice(0, 5);
  const questions = listUnansweredQuestions().slice(0, 5);
  const replies = listRightOfReplies().slice(0, 2);
  const stats = getPlatformStats();

  const leadArticle = articles[0];
  const topSecondary = articles.slice(1, 3);
  const moreArticles = articles.slice(3, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "Bongkar Danantara",
    description:
      "Platform investigasi independen untuk pengungkapan, dokumentasi, dan pengawasan publik terkait Danantara Indonesia.",
    slogan: "Uang Rakyat, Kekuasaan Besar, Transparansi Harus Dibuka.",
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO EDITORIAL BANNER (Section 3 Exact Headline & Subheadline) */}
      <section className="bg-[#121210] text-[#F7F6F2] border-b-4 border-[#9E1B1B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-2.5 py-1 bg-[#9E1B1B] text-white font-data text-[11px] font-bold uppercase tracking-widest">
                  LAPORAN PENGAWASAN UTAMA
                </span>
                <span className="font-data text-xs text-[#C7C2B6]">
                  {stats.articlesPublished} Investigasi • {stats.documentsTotal} Arsip PDF • {stats.entitiesTotal} Profil Entitas
                </span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.06] tracking-tight text-white">
                SIAPA YANG MENGAWASI PENGELOLA UANG DAN ASET NEGARA?
              </h1>

              <p className="text-base sm:text-lg text-[#D8D4CB] leading-relaxed max-w-3xl">
                Danantara memiliki kekuasaan besar atas pengelolaan investasi dan
                aset negara. Publik berhak mengetahui bagaimana keputusan dibuat,
                siapa yang diuntungkan, dan siapa yang harus bertanggung jawab.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/investigasi"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#9E1B1B] hover:bg-[#781111] text-white font-data text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Baca Investigasi Terbaru
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dokumen"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-transparent border border-[#E8E4DC] hover:bg-[#F7F6F2] hover:text-[#0D0D0D] text-[#F7F6F2] font-data text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Buka Vault Dokumen PDF
                </Link>
                <Link
                  href="/database"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#21201D] border border-[#52504A] hover:border-white text-[#E8E4DC] font-data text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Telusuri Database Entitas
                </Link>
              </div>
            </div>

            {/* Data & Fakta Danantara Key Counter Ledger */}
            <aside className="lg:col-span-4 bg-[#1B1A17] border border-[#3D3B36] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#3D3B36] pb-2.5">
                <span className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
                  DATA &amp; FAKTA DANANTARA
                </span>
                <span className="font-data text-[10px] text-[#A6A197]">
                  PER NOV 2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="border-l-2 border-[#9E1B1B] pl-3">
                  <p className="font-data text-xl font-bold text-white">
                    Rp9.353,4 T
                  </p>
                  <p className="text-[11px] text-[#C7C2B6] leading-snug mt-0.5">
                    Aset bruto 7 BUMN awal (FY 2024); 59,3% dana bank.
                  </p>
                </div>
                <div className="border-l-2 border-[#52504A] pl-3">
                  <p className="font-data text-xl font-bold text-white">
                    ~US$900 M
                  </p>
                  <p className="text-[11px] text-[#C7C2B6] leading-snug mt-0.5">
                    Klaim publik AUM (rincian per aset belum dibuka).
                  </p>
                </div>
                <div className="border-l-2 border-[#166534] pl-3">
                  <p className="font-data text-xl font-bold text-white">
                    Rp81,7 T
                  </p>
                  <p className="text-[11px] text-[#C7C2B6] leading-snug mt-0.5">
                    Dividen 7 BUMN 2024 (95,6% dari Rp85,5 T nasional).
                  </p>
                </div>
                <div className="border-l-2 border-[#8C6D46] pl-3">
                  <p className="font-data text-xl font-bold text-white">
                    Rp300 T
                  </p>
                  <p className="text-[11px] text-[#C7C2B6] leading-snug mt-0.5">
                    Dana efisiensi APBN; daftar proyek &amp; mitra belum terbuka.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#3D3B36] flex items-center justify-between text-xs font-data">
                <span className="text-[#FCA5A5]">
                  {stats.unansweredOpen} Pertanyaan Publik Belum Tuntas
                </span>
                <Link
                  href="/keuangan"
                  className="text-white hover:text-[#FCA5A5] underline underline-offset-4"
                >
                  Bedah Angka
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* STATUS LEGEND BAR */}
      <section className="bg-[#EFECE6] border-b border-[#141414]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-data text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D]">
            STANDAR LABEL VERIFIKASI:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="TERBUKTI" />
            <StatusBadge status="TERDOKUMENTASI" />
            <StatusBadge status="DUGAAN" />
            <StatusBadge status="BELUM TERVERIFIKASI" />
            <StatusBadge status="BANTAHAN" />
          </div>
          <Link
            href="/metodologi"
            className="font-data text-[11px] text-[#9E1B1B] font-semibold hover:underline"
          >
            Baca Metodologi Pemisahan Fakta &amp; Dugaan
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">
        {/* SECTION 1: BROADSHEET LEAD + TOP INVESTIGATIONS */}
        <section>
          <div className="flex items-end justify-between border-b-2 border-[#141414] pb-3 mb-6">
            <div>
              <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
                EDISI UTAMA // INVESTIGASI TERBARU
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#0D0D0D]">
                Laporan Utama dan Status Pembuktian
              </h2>
            </div>
            <Link
              href="/investigasi"
              className="font-data text-xs font-semibold uppercase tracking-wider text-[#9E1B1B] hover:underline inline-flex items-center gap-1"
            >
              Semua Laporan ({stats.articlesPublished})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {leadArticle && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-[#D6D1C6]">
              {/* Lead Story */}
              <article className="lg:col-span-7 lg:pr-8 lg:border-r lg:border-[#D6D1C6]">
                <Link
                  href={`/investigasi/${leadArticle.slug}`}
                  className="group block"
                >
                  {leadArticle.cover_image && (
                    <div className="border border-[#141414] bg-[#121210] overflow-hidden mb-4">
                      <img
                        src={withBasePath(leadArticle.cover_image)}
                        alt={leadArticle.title}
                        className="w-full h-auto block"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    <StatusBadge status={leadArticle.verification_status} size="md" />
                    <span className="font-data text-[11px] font-bold uppercase tracking-wider text-[#9E1B1B]">
                      {leadArticle.category_name}
                    </span>
                    <span className="font-data text-[11px] text-[#5F5B53]">
                      • {formatIndonesianDate(leadArticle.published_at)} •{" "}
                      {leadArticle.reading_time_min} menit baca
                    </span>
                  </div>
                  <h3 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#0D0D0D] group-hover:text-[#9E1B1B] leading-[1.12] transition-colors">
                    {leadArticle.title}
                  </h3>
                  <p className="mt-3 text-base text-[#2F2E2B] leading-relaxed">
                    {leadArticle.subtitle}
                  </p>
                  <p className="mt-3 font-data text-xs text-[#5F5B53]">
                    Oleh: {leadArticle.authors}
                  </p>
                </Link>
              </article>

              {/* Two Secondary Top Stories */}
              <div className="lg:col-span-5 flex flex-col divide-y divide-[#D6D1C6]">
                {topSecondary.map((art) => (
                  <article key={art.id} className="py-5 first:pt-0 last:pb-0">
                    <Link
                      href={`/investigasi/${art.slug}`}
                      className="group block"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusBadge status={art.verification_status} />
                        <span className="font-data text-[11px] font-bold uppercase text-[#9E1B1B]">
                          {art.category_name}
                        </span>
                      </div>
                      <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#0D0D0D] group-hover:text-[#9E1B1B] leading-snug transition-colors">
                        {art.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#2F2E2B] leading-relaxed">
                        {art.excerpt}
                      </p>
                      <div className="mt-3 flex items-center justify-between font-data text-[11px] text-[#5F5B53]">
                        <span>{formatIndonesianDate(art.published_at)}</span>
                        <span className="text-[#9E1B1B] font-semibold group-hover:underline">
                          Periksa Bukti &amp; Sumber →
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Additional Articles Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {moreArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white border border-[#D6D1C6] hover:border-[#141414] p-5 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <StatusBadge status={art.verification_status} />
                    <span className="font-data text-[10px] font-bold uppercase tracking-wider text-[#5F5B53]">
                      {art.category_name}
                    </span>
                  </div>
                  <Link href={`/investigasi/${art.slug}`} className="group">
                    <h3 className="font-editorial text-xl font-bold text-[#0D0D0D] group-hover:text-[#9E1B1B] leading-snug">
                      {art.title}
                    </h3>
                  </Link>
                  <p className="mt-2 text-sm text-[#3F3D39] leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center justify-between font-data text-[11px] text-[#5F5B53]">
                  <span>{formatIndonesianDate(art.published_at)}</span>
                  <Link
                    href={`/investigasi/${art.slug}`}
                    className="text-[#9E1B1B] font-semibold hover:underline"
                  >
                    Buka Laporan
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 2: ANALISIS KEUANGAN INTERAKTIF */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-[#141414] pb-3 mb-6 gap-2">
            <div>
              <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
                DESK DATA // ANALISIS KEUANGAN
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#0D0D0D]">
                Menguji Angka Neraca dan Konsentrasi Dividen 7 BUMN
              </h2>
            </div>
            <Link
              href="/keuangan"
              className="font-data text-xs font-semibold uppercase tracking-wider text-[#9E1B1B] hover:underline inline-flex items-center gap-1"
            >
              Buka Dashboard Keuangan Lengkap &amp; Unduh CSV
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <FinancialCharts records={financials} compact />
        </section>

        {/* SECTION 3: DOKUMEN YANG BERHASIL DIPEROLEH + PERTANYAAN BELUM DIJAWAB */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Vault Dokumen Preview */}
          <div className="lg:col-span-6">
            <div className="flex items-end justify-between border-b-2 border-[#141414] pb-3 mb-5">
              <div>
                <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#163A5F]">
                  BUKTI PRIMER // ARSIP PDF
                </p>
                <h2 className="font-editorial text-2xl font-extrabold text-[#0D0D0D]">
                  Dokumen yang Berhasil Diperoleh
                </h2>
              </div>
              <Link
                href="/dokumen"
                className="font-data text-xs font-semibold text-[#9E1B1B] hover:underline"
              >
                Semua ({stats.documentsTotal}) →
              </Link>
            </div>

            <div className="divide-y divide-[#D6D1C6] border border-[#141414] bg-white">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-[#FAF9F6] transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#9E1B1B] shrink-0" />
                      <span className="font-data text-xs font-bold text-[#0D0D0D]">
                        {doc.doc_number}
                      </span>
                      <StatusBadge status={doc.verification_status} />
                    </div>
                    <span className="font-data text-[11px] text-[#5F5B53]">
                      {doc.page_count} HLM • {doc.file_size_kb} KB PDF
                    </span>
                  </div>
                  <Link
                    href={`/dokumen/${doc.id}`}
                    className="font-editorial text-lg font-bold text-[#0D0D0D] hover:text-[#9E1B1B] leading-snug block"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-[#3F3D39] mt-1.5 line-clamp-2">
                    {doc.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 font-data text-[11px]">
                    <Link
                      href={`/dokumen/${doc.id}`}
                      className="text-[#9E1B1B] font-semibold hover:underline"
                    >
                      Baca PDF &amp; Periksa Kutipan
                    </Link>
                    <a
                      href={withBasePath(doc.file_path)}
                      download
                      className="text-[#163A5F] hover:underline"
                    >
                      Unduh PDF
                    </a>
                    <span className="text-[#78716C]">
                      SHA-256: {doc.sha256_hash.slice(0, 12)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pertanyaan Belum Dijawab */}
          <div className="lg:col-span-6">
            <div className="flex items-end justify-between border-b-2 border-[#141414] pb-3 mb-5">
              <div>
                <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
                  AKUNTABILITAS PUBLIK
                </p>
                <h2 className="font-editorial text-2xl font-extrabold text-[#0D0D0D]">
                  Pertanyaan yang Belum Dijawab
                </h2>
              </div>
              <Link
                href="/hak-jawab"
                className="font-data text-xs font-semibold text-[#9E1B1B] hover:underline"
              >
                Lihat Hak Jawab →
              </Link>
            </div>

            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-[#D6D1C6] border-l-4 border-l-[#9E1B1B] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 font-data text-xs font-bold text-[#0D0D0D]">
                      <HelpCircle className="w-3.5 h-3.5 text-[#9E1B1B]" />
                      {q.code} — {q.category}
                    </span>
                    <span
                      className={`font-data text-[10px] font-bold uppercase px-2 py-0.5 border ${getQuestionStatusStyles(
                        q.status
                      )}`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="font-editorial text-base font-bold text-[#0D0D0D] leading-snug">
                    {q.question}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-data text-[11px] text-[#5F5B53]">
                    <span>Ditujukan kepada: {q.addressed_to}</span>
                    {q.related_article_slug && (
                      <Link
                        href={`/investigasi/${q.related_article_slug}`}
                        className="text-[#9E1B1B] hover:underline"
                      >
                        Konteks Investigasi
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: TIMELINE KEPUTUSAN PENTING */}
        <section>
          <div className="flex items-end justify-between border-b-2 border-[#141414] pb-3 mb-6">
            <div>
              <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
                KRONOLOGI KEBIJAKAN &amp; HUKUM
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#0D0D0D]">
                Timeline Keputusan Penting Danantara (2025–2026)
              </h2>
            </div>
            <Link
              href="/timeline"
              className="font-data text-xs font-semibold uppercase tracking-wider text-[#9E1B1B] hover:underline inline-flex items-center gap-1"
            >
              Timeline Lengkap
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {timeline.map((ev) => (
              <div
                key={ev.id}
                className="bg-white border border-[#141414] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 font-data text-[11px] font-bold text-[#9E1B1B]">
                      <Clock className="w-3 h-3" />
                      {ev.display_date}
                    </span>
                  </div>
                  <div className="mb-2">
                    <StatusBadge status={ev.verification_status} />
                  </div>
                  <h3 className="font-editorial text-base font-bold text-[#0D0D0D] leading-snug">
                    {ev.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#3F3D39] leading-relaxed line-clamp-4">
                    {ev.summary}
                  </p>
                </div>
                {ev.document_id && (
                  <Link
                    href={`/dokumen/${ev.document_id}`}
                    className="mt-3 pt-2 border-t border-[#EFECE6] font-data text-[11px] text-[#163A5F] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Arsip: {ev.document_id}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: 6 KATEGORI INVESTIGASI + BANTAHAN RESMI + WHISTLEBLOWER */}
        <section className="space-y-8">
          <div className="border-b-2 border-[#141414] pb-3">
            <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
              ENAM PILAR PENGAWASAN
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#0D0D0D]">
              Kategori Investigasi Bongkar Danantara
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="group bg-white border border-[#141414] p-5 hover:bg-[#141414] hover:text-white transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B] group-hover:text-[#FCA5A5]">
                      KATEGORI {cat.code}
                    </span>
                    <span className="font-data text-[11px] text-[#5F5B53] group-hover:text-[#C7C2B6]">
                      {cat.article_count ?? 0} Laporan
                    </span>
                  </div>
                  <h3 className="font-editorial text-xl font-bold leading-snug">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#3F3D39] group-hover:text-[#D8D4CB] leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 font-data text-xs font-semibold text-[#9E1B1B] group-hover:text-white">
                  Buka Arsip Desk
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* Dual Action Banner: Right of Reply + Confidential Tip Drop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Official Right of Reply Preview */}
            <div className="lg:col-span-7 bg-white border-2 border-[#141414] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D6D1C6] pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#581C87]" />
                  <h3 className="font-editorial text-xl font-bold text-[#0D0D0D]">
                    Hak Jawab &amp; Bantahan Resmi Tercatat
                  </h3>
                </div>
                <Link
                  href="/hak-jawab"
                  className="font-data text-xs font-semibold text-[#581C87] hover:underline"
                >
                  Semua ({stats.repliesTotal}) →
                </Link>
              </div>
              <p className="text-sm text-[#3F3D39]">
                Kami tidak menyembunyikan bantahan relevan dari Danantara,
                pemerintah, atau pihak yang disebut dalam investigasi.
              </p>
              <div className="space-y-3">
                {replies.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-[#FAF9F6] border border-[#D6D1C6] border-l-4 border-l-[#581C87]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <StatusBadge status="BANTAHAN" />
                      <span className="font-data text-[11px] text-[#5F5B53]">
                        {formatIndonesianDate(r.response_date)}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-[#0D0D0D]">
                      {r.topic}
                    </p>
                    <p className="text-xs text-[#3F3D39] mt-1 line-clamp-2">
                      {r.official_response_text}
                    </p>
                    <p className="font-data text-[11px] text-[#5F5B53] mt-1.5">
                      Pihak Penanggap: {r.respondent_name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Whistleblower Drop Box */}
            <div className="lg:col-span-5 bg-[#9E1B1B] text-white p-6 flex flex-col justify-between border-2 border-[#141414]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#141414] font-data text-[11px] font-bold uppercase tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FCA5A5]" />
                  KANAL LAPORAN PUBLIK
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl font-extrabold leading-tight">
                  Memiliki Dokumen, Data Transaksi, atau Informasi Internal?
                </h3>
                <p className="text-sm text-[#FCE8E8] leading-relaxed">
                  Pegawai, mantan pegawai, auditor, maupun warga negara dapat
                  mengirimkan laporan dan dokumen pendukung secara anonim atau
                  nama samaran. Setiap laporan melewati moderasi dan verifikasi
                  independen sebelum dipublikasikan.
                </p>
                <div className="bg-[#781111] border border-[#C86464] p-3 text-xs font-data text-[#FCE8E8]">
                  Catatan Keamanan Jujur: Infrastruktur web standar tidak menjamin
                  anonimitas absolut di tingkat jaringan. Baca panduan pengamanan
                  metadata sebelum mengunggah file sensitif.
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/lapor"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#141414] hover:bg-black text-white font-data text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Kirim Laporan Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/database"
                  className="inline-flex items-center gap-2 px-4 py-3 border border-white/60 hover:bg-white hover:text-[#141414] font-data text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  Database ({stats.entitiesTotal})
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
