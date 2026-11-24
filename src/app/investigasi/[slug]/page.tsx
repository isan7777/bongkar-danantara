import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  Scale,
  History,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Users,
  ArrowLeft,
} from "lucide-react";
import { getArticleDetail, listArticles } from "@/lib/db/queries";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatIndonesianDate,
  getClaimTypeStyles,
} from "@/lib/format";
import { withBasePath } from "@/lib/paths";

export function generateStaticParams() {
  return listArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getArticleDetail(slug);
  if (!detail) return { title: "Laporan Tidak Ditemukan" };
  return {
    title: detail.article.title,
    description: detail.article.subtitle,
    openGraph: {
      type: "article",
      title: detail.article.title,
      description: detail.article.subtitle,
      publishedTime: detail.article.published_at,
      modifiedTime: detail.article.updated_at,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getArticleDetail(slug);
  if (!detail) notFound();

  const { article, sources, corrections, entities, replies } = detail;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.subtitle,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Organization",
      name: article.authors,
    },
    publisher: {
      "@type": "Organization",
      name: "Bongkar Danantara",
    },
  };

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-[#D6D1C6] font-data text-xs">
        <Link
          href="/investigasi"
          className="inline-flex items-center gap-1.5 text-[#5F5B53] hover:text-[#9E1B1B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Indeks Investigasi
        </Link>
        <Link
          href={`/kategori/${article.category_slug}`}
          className="font-bold uppercase tracking-wider text-[#9E1B1B] hover:underline"
        >
          KATEGORI {article.category_code}: {article.category_name}
        </Link>
      </div>

      {/* Article Header */}
      <header className="max-w-4xl space-y-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={article.verification_status} size="md" />
          <span className="font-data text-xs text-[#5F5B53]">
            ID LAPORAN: {article.id}
          </span>
          <span className="font-data text-xs text-[#5F5B53]">
            • {article.reading_time_min} MENIT BACA
          </span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] leading-[1.08] tracking-tight">
          {article.title}
        </h1>

        <p className="text-lg sm:text-xl text-[#2F2E2B] leading-relaxed font-normal">
          {article.subtitle}
        </p>

        {/* Mandatory Editorial Accountability Metadata (Section 9) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-[#141414] p-4 font-data text-xs">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#5F5B53]">
              PENULIS / TIM INVESTIGASI
            </span>
            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
              {article.authors}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#5F5B53]">
              TANGGAL PUBLIKASI
            </span>
            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
              {formatIndonesianDate(article.published_at)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#5F5B53]">
              PEMBARUAN TERAKHIR
            </span>
            <span className="font-semibold text-[#9E1B1B] mt-0.5 block">
              {formatIndonesianDate(article.updated_at)}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Editorial Column */}
        <div className="lg:col-span-8 space-y-10">
          {article.cover_image && (
            <figure className="border border-[#141414] bg-white">
              <img
                src={withBasePath(article.cover_image)}
                alt={article.title}
                className="w-full h-auto block"
              />
              {article.cover_caption && (
                <figcaption className="px-4 py-2.5 bg-[#EFECE6] border-t border-[#D6D1C6] font-data text-[11px] text-[#3F3D39]">
                  {article.cover_caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Ringkasan Temuan & Status Pembuktian */}
          {article.key_findings.length > 0 && (
            <section className="bg-[#FAF9F6] border-2 border-[#141414] p-5 sm:p-6">
              <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B] mb-3">
                RINGKASAN TEMUAN &amp; DERAJAT PEMBUKTIAN
              </p>
              <ul className="space-y-3">
                {article.key_findings.map((finding, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-start gap-2.5 pb-3 last:pb-0 border-b last:border-b-0 border-[#E5E1D8]"
                  >
                    <div className="shrink-0 pt-0.5">
                      <StatusBadge status={finding.status} />
                    </div>
                    <div className="text-sm text-[#1F1E1C] leading-relaxed">
                      <span>{finding.text}</span>
                      {finding.doc_id && (
                        <Link
                          href={`/dokumen/${finding.doc_id}`}
                          className="ml-2 font-data text-[11px] font-semibold text-[#163A5F] hover:underline whitespace-nowrap"
                        >
                          [{finding.doc_id}
                          {finding.page_ref ? `, ${finding.page_ref}` : ""}]
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Structured Article Sections separating Fakta / Analisis / Dugaan / Pertanyaan */}
          <div className="space-y-10">
            {article.body_sections.map((section) => {
              const claimStyle = getClaimTypeStyles(section.claim_type);
              return (
                <section
                  key={section.id}
                  className={`border-l-4 ${claimStyle.borderClass} pl-5 sm:pl-6`}
                >
                  <div className="mb-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 font-data text-[10px] font-bold uppercase tracking-widest ${claimStyle.badgeClass}`}
                    >
                      {claimStyle.label}
                    </span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0D0D0D] leading-snug mb-4">
                    {section.heading}
                  </h2>

                  <div className="editorial-prose">
                    {section.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>

                  {section.callout && (
                    <div className="mt-5 bg-[#FAF0F0] border border-[#9E1B1B] p-4">
                      <p className="font-data text-[11px] font-bold uppercase tracking-wider text-[#9E1B1B]">
                        {section.callout.label}
                      </p>
                      <p className="mt-1.5 text-sm text-[#1F1E1C] leading-relaxed">
                        {section.callout.text}
                      </p>
                      {section.callout.source_ref && (
                        <p className="mt-2 font-data text-[11px] text-[#5F5B53]">
                          Rujukan: {section.callout.source_ref}
                        </p>
                      )}
                    </div>
                  )}

                  {section.quote && (
                    <blockquote className="mt-5 bg-white border border-[#141414] border-l-4 border-l-[#141414] p-5">
                      <p className="font-editorial italic text-lg text-[#0D0D0D] leading-relaxed">
                        &ldquo;{section.quote.text}&rdquo;
                      </p>
                      <footer className="mt-2.5 font-data text-xs text-[#5F5B53]">
                        — {section.quote.attribution} ({section.quote.page_ref})
                      </footer>
                    </blockquote>
                  )}
                </section>
              );
            })}
          </div>

          {/* Pertanyaan Belum Terjawab dalam Artikel */}
          {article.unanswered_in_article.length > 0 && (
            <section className="bg-[#141414] text-[#F7F6F2] p-6 border-t-4 border-[#9E1B1B]">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-[#FCA5A5]" />
                <h2 className="font-editorial text-xl font-bold">
                  Pertanyaan Kunci yang Belum Terjawab
                </h2>
              </div>
              <ol className="list-decimal list-inside space-y-2.5 text-sm text-[#E8E4DC] leading-relaxed">
                {article.unanswered_in_article.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ol>
            </section>
          )}

          {/* MANDATORY SECTION: BUKTI DAN SUMBER (Section 6) */}
          <section
            id="bukti-dan-sumber"
            className="bg-white border-2 border-[#141414] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#9E1B1B]" />
                <h2 className="font-editorial text-2xl font-extrabold text-[#0D0D0D]">
                  BUKTI DAN SUMBER
                </h2>
              </div>
              <span className="font-data text-xs font-semibold text-[#5F5B53]">
                {sources.length} DOKUMEN TERVERIFIKASI
              </span>
            </div>

            <div className="divide-y divide-[#D6D1C6]">
              {sources.map((src, idx) => (
                <div key={src.id} className="py-4 first:pt-1 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-data text-xs font-bold text-[#9E1B1B]">
                      SUMBER #{idx + 1} • {src.page_ref}
                    </span>
                    <StatusBadge status={src.evidence_type} />
                  </div>
                  <h3 className="font-semibold text-base text-[#0D0D0D]">
                    {src.source_title}
                  </h3>
                  <p className="font-data text-xs text-[#5F5B53]">
                    Penerbit / Otoritas: {src.source_publisher}
                  </p>
                  <blockquote className="bg-[#F7F6F2] border-l-2 border-[#163A5F] px-3.5 py-2.5 text-sm italic text-[#1F1E1C]">
                    &ldquo;{src.quote_excerpt}&rdquo;
                  </blockquote>
                  <div className="flex flex-wrap items-center gap-4 font-data text-xs pt-1">
                    {src.document_id && (
                      <Link
                        href={`/dokumen/${src.document_id}`}
                        className="font-bold text-[#9E1B1B] hover:underline"
                      >
                        Buka PDF &amp; Periksa Halaman di Vault ({src.document_id})
                      </Link>
                    )}
                    {src.source_url && (
                      <a
                        href={src.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#163A5F] hover:underline"
                      >
                        Portal Sumber Asli
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Metodologi Verifikasi (Section 9) */}
          <section className="bg-[#EFECE6] border border-[#141414] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#163A5F]" />
              <h2 className="font-data text-xs font-bold uppercase tracking-widest text-[#0D0D0D]">
                METODOLOGI VERIFIKASI REDAKSI
              </h2>
            </div>
            <p className="text-sm text-[#2F2E2B] leading-relaxed">
              {article.methodology}
            </p>
          </section>

          {/* Hak Jawab & Bantahan Terkait (Section 9) */}
          <section className="bg-white border border-[#581C87] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6D1C6] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#581C87]" />
                <h2 className="font-editorial text-xl font-bold text-[#0D0D0D]">
                  Hak Jawab &amp; Tanggapan Pihak Terkait
                </h2>
              </div>
              <Link
                href="/hak-jawab#ajukan-hak-jawab"
                className="font-data text-xs font-bold text-[#581C87] hover:underline"
              >
                Ajukan Hak Jawab Resmi →
              </Link>
            </div>

            {replies.length === 0 ? (
              <p className="text-sm text-[#3F3D39]">
                Belum ada tanggapan resmi tertulis dari pihak yang disebut dalam
                laporan ini. Ruang hak jawab tetap terbuka dan akan dipublikasikan
                secara utuh pada bagian ini begitu diterima dan diverifikasi.
              </p>
            ) : (
              <div className="space-y-4">
                {replies.map((r) => (
                  <div key={r.id} className="bg-[#FAF9F6] border border-[#D6D1C6] p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status="BANTAHAN" />
                      <span className="font-data text-xs text-[#5F5B53]">
                        {formatIndonesianDate(r.response_date)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#0D0D0D]">
                      {r.respondent_name} — {r.respondent_role}
                    </h3>
                    <p className="text-sm text-[#1F1E1C] leading-relaxed">
                      {r.official_response_text}
                    </p>
                    <p className="text-xs font-data text-[#5F5B53] border-t border-[#E5E1D8] pt-2">
                      {r.editorial_verification_note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Catatan Koreksi (Section 9) */}
          <section className="bg-white border border-[#D6D1C6] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#0D0D0D]" />
              <h2 className="font-data text-xs font-bold uppercase tracking-widest text-[#0D0D0D]">
                CATATAN KOREKSI &amp; RIWAYAT PEMBARUAN
              </h2>
            </div>
            {corrections.length === 0 ? (
              <p className="text-xs font-data text-[#5F5B53]">
                Belum ada koreksi substantif sejak tanggal publikasi{" "}
                {formatIndonesianDate(article.published_at)}. Jika Anda menemukan
                kesalahan data atau kutipan, kirimkan koreksi disertai dokumen
                pembanding melalui halaman Hak Jawab.
              </p>
            ) : (
              <div className="space-y-3">
                {corrections.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-[#FAF9F6] border-l-2 border-[#141414] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-data text-[#5F5B53]">
                      <span className="font-bold text-[#9E1B1B]">
                        {c.correction_type}
                      </span>
                      <span>
                        {formatIndonesianDate(c.correction_date)} • {c.editor_name}
                      </span>
                    </div>
                    <p className="text-sm text-[#0D0D0D]">{c.summary}</p>
                    {c.previous_text && c.updated_text && (
                      <div className="grid sm:grid-cols-2 gap-2 pt-2 font-data text-[11px]">
                        <div className="p-2 bg-[#FAF0F0] text-[#781111]">
                          <strong className="block">Sebelumnya:</strong>
                          {c.previous_text}
                        </div>
                        <div className="p-2 bg-[#E6F4EA] text-[#14532D]">
                          <strong className="block">Diperbarui menjadi:</strong>
                          {c.updated_text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar: Entities Mentioned + Quick Navigation */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white border border-[#141414] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D6D1C6] pb-2.5">
              <Users className="w-4 h-4 text-[#9E1B1B]" />
              <h2 className="font-data text-xs font-bold uppercase tracking-widest text-[#0D0D0D]">
                ENTITAS DALAM LAPORAN ({entities.length})
              </h2>
            </div>
            <p className="text-xs text-[#5F5B53] leading-relaxed">
              Pencantuman nama individu, lembaga, atau perusahaan di bawah ini
              merupakan rujukan entitas terdokumentasi dan bukan tuduhan pidana.
            </p>
            <div className="divide-y divide-[#EFECE6]">
              {entities.map((ent) => (
                <Link
                  key={ent.id}
                  href={`/database/${ent.slug}`}
                  className="block py-3 hover:bg-[#FAF9F6] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-[#0D0D0D] hover:text-[#9E1B1B]">
                      {ent.name}
                    </span>
                    <span className="font-data text-[10px] uppercase px-1.5 py-0.5 bg-[#EFECE6] text-[#3F3D39]">
                      {ent.entity_type}
                    </span>
                  </div>
                  <p className="text-xs text-[#5F5B53] mt-0.5 line-clamp-1">
                    {ent.current_role}
                  </p>
                </Link>
              ))}
            </div>
            <Link
              href="/database"
              className="block text-center py-2 border border-[#141414] font-data text-xs font-bold uppercase hover:bg-[#141414] hover:text-white transition-colors"
            >
              Telusuri Seluruh Database
            </Link>
          </div>

          <div className="bg-[#141414] text-white p-5 space-y-3">
            <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#FCA5A5]">
              PUNYA BUKTI TAMBAHAN?
            </p>
            <p className="font-editorial text-lg font-bold leading-snug">
              Bantu redaksi melengkapi dokumen terkait topik ini.
            </p>
            <p className="text-xs text-[#C7C2B6] leading-relaxed">
              Kirimkan salinan dokumen publik, risalah, atau koreksi data secara
              aman melalui kanal pelaporan masyarakat.
            </p>
            <Link
              href="/lapor"
              className="block text-center py-2.5 bg-[#9E1B1B] hover:bg-[#781111] font-data text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Kirim Dokumen / Laporan
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
