import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Network,
  Clock,
  Briefcase,
  ShieldCheck,
  Newspaper,
} from "lucide-react";
import { getEntityDetail, listEntities } from "@/lib/db/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIndonesianDate, formatTrillionIdr } from "@/lib/format";

export function generateStaticParams() {
  return listEntities().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getEntityDetail(slug);
  if (!detail) return { title: "Entitas Tidak Ditemukan" };
  return {
    title: `Profil Entitas: ${detail.entity.name}`,
    description: detail.entity.summary,
  };
}

export default async function EntityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getEntityDetail(slug);
  if (!detail) notFound();

  const { entity, relations, articles, documents, financials } = detail;

  // Radial positions for visual SVG relationship map (up to 8 visible nodes)
  const graphRelations = relations.slice(0, 8);
  const cx = 360;
  const cy = 190;
  const rx = 250;
  const ry = 135;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-[#D6D1C6] pb-3 font-data text-xs">
        <Link
          href="/database"
          className="inline-flex items-center gap-1.5 text-[#5F5B53] hover:text-[#9E1B1B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Database Investigasi
        </Link>
        <span className="text-[#5F5B53]">ID ENTITAS: {entity.id}</span>
      </div>

      {/* Entity Header */}
      <header className="bg-[#141414] text-[#F7F6F2] p-6 sm:p-8 border-b-4 border-[#9E1B1B]">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className="px-2.5 py-1 bg-[#9E1B1B] text-white font-data text-[11px] font-bold uppercase tracking-wider">
            {entity.entity_type}
          </span>
          <StatusBadge status={entity.verification_status} size="md" />
          <span className="font-data text-xs text-[#C7C2B6]">
            Sektor: {entity.sector} • Tahun Tercatat: {entity.year_active}
          </span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold leading-tight">
          {entity.name}
        </h1>
        <p className="mt-2 font-data text-sm text-[#FCA5A5] font-semibold">
          {entity.current_role}
          {entity.organization ? ` — ${entity.organization}` : ""}
        </p>
        <p className="mt-4 text-base text-[#E8E4DC] leading-relaxed max-w-4xl">
          {entity.summary}
        </p>

        {entity.key_metrics.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#3D3B36] grid grid-cols-1 sm:grid-cols-3 gap-4">
            {entity.key_metrics.map((m, idx) => (
              <div key={idx} className="bg-[#1E1D1A] border border-[#3D3B36] p-3.5">
                <p className="font-data text-[10px] uppercase tracking-wider text-[#A6A197]">
                  {m.label}
                </p>
                <p className="font-data text-lg font-bold text-white mt-1">
                  {m.value}
                </p>
                <p className="text-[11px] text-[#C7C2B6] mt-0.5">{m.note}</p>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Mandatory Neutrality Note */}
      <div className="bg-[#EFECE6] border border-[#141414] p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#163A5F] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#1F1E1C] leading-relaxed">
          <strong>Catatan Metodologi:</strong> Seluruh riwayat jabatan, relasi
          organisasi, dan catatan kronologi di halaman profil ini berasal dari
          dokumen publik dan regulasi resmi. Hubungan profesional atau struktural
          yang terdokumentasi di bawah ini <strong>tidak menggambarkan dan tidak
          dapat ditafsirkan sebagai bukti tindak pidana</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Interactive Documented Relationship Map + Table */}
          <section className="bg-white border-2 border-[#141414] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#D6D1C6] pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-[#9E1B1B]" />
                <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
                  Peta Relasi Terdokumentasi ({relations.length})
                </h2>
              </div>
              <span className="font-data text-[11px] text-[#5F5B53]">
                BERBASIS DOKUMEN PRIMER
              </span>
            </div>

            {relations.length === 0 ? (
              <p className="text-sm text-[#5F5B53]">
                Belum ada relasi lintas entitas yang terhubung dalam arsip saat ini.
              </p>
            ) : (
              <>
                {/* SVG Relation Diagram */}
                <div className="bg-[#FAF9F6] border border-[#D6D1C6] overflow-x-auto p-2">
                  <svg
                    viewBox="0 0 720 380"
                    className="w-full min-w-[540px] h-auto"
                    role="img"
                    aria-label={`Diagram relasi terdokumentasi untuk ${entity.name}`}
                  >
                    {graphRelations.map((rel, idx) => {
                      const angle =
                        (idx / graphRelations.length) * Math.PI * 2 -
                        Math.PI / 2;
                      const nx = cx + Math.cos(angle) * rx;
                      const ny = cy + Math.sin(angle) * ry;
                      return (
                        <g key={rel.id}>
                          <line
                            x1={cx}
                            y1={cy}
                            x2={nx}
                            y2={ny}
                            stroke="#9E1B1B"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <rect
                            x={nx - 78}
                            y={ny - 22}
                            width="156"
                            height="44"
                            fill="#FFFFFF"
                            stroke="#141414"
                            strokeWidth="1.5"
                          />
                          <text
                            x={nx}
                            y={ny - 4}
                            textAnchor="middle"
                            fill="#0D0D0D"
                            fontFamily="sans-serif"
                            fontSize="10.5"
                            fontWeight="700"
                          >
                            {rel.other_entity.name.slice(0, 22)}
                            {rel.other_entity.name.length > 22 ? "..." : ""}
                          </text>
                          <text
                            x={nx}
                            y={ny + 12}
                            textAnchor="middle"
                            fill="#9E1B1B"
                            fontFamily="monospace"
                            fontSize="8.5"
                          >
                            {rel.relation_type}
                          </text>
                        </g>
                      );
                    })}

                    {/* Center Active Entity Node */}
                    <rect
                      x={cx - 96}
                      y={cy - 28}
                      width="192"
                      height="56"
                      fill="#141414"
                      stroke="#9E1B1B"
                      strokeWidth="2.5"
                    />
                    <text
                      x={cx}
                      y={cy - 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="sans-serif"
                      fontSize="11.5"
                      fontWeight="700"
                    >
                      {entity.name.slice(0, 24)}
                      {entity.name.length > 24 ? "..." : ""}
                    </text>
                    <text
                      x={cx}
                      y={cy + 14}
                      textAnchor="middle"
                      fill="#FCA5A5"
                      fontFamily="monospace"
                      fontSize="9"
                    >
                      {entity.entity_type}
                    </text>
                  </svg>
                </div>

                {/* Detailed Verifiable Relations Table */}
                <div className="divide-y divide-[#D6D1C6] border border-[#D6D1C6]">
                  {relations.map((rel) => (
                    <div key={rel.id} className="p-4 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-data text-[10px] font-bold uppercase px-2 py-0.5 bg-[#EFECE6] border border-[#141414] text-[#0D0D0D]">
                            {rel.relation_type}
                          </span>
                          <Link
                            href={`/database/${rel.other_entity.slug}`}
                            className="font-semibold text-sm text-[#9E1B1B] hover:underline"
                          >
                            {rel.other_entity.name}
                          </Link>
                        </div>
                        <StatusBadge status={rel.verification_status} />
                      </div>
                      <p className="text-sm text-[#2F2E2B]">{rel.description}</p>
                      <div className="flex flex-wrap items-center gap-3 font-data text-[11px] text-[#5F5B53]">
                        <span>Periode: {rel.period}</span>
                        <span>•</span>
                        <span>Sumber: {rel.source_ref}</span>
                        {rel.document_id && (
                          <Link
                            href={`/dokumen/${rel.document_id}`}
                            className="text-[#163A5F] font-semibold hover:underline"
                          >
                            [Lihat Dokumen {rel.document_id}]
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Riwayat Jabatan / Peran */}
          <section className="bg-white border border-[#141414] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D6D1C6] pb-3">
              <Briefcase className="w-5 h-5 text-[#163A5F]" />
              <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
                Riwayat Jabatan &amp; Mandat Struktural
              </h2>
            </div>

            {entity.positions_history.length === 0 ? (
              <p className="text-sm text-[#5F5B53]">
                Belum ada riwayat jabatan tambahan yang diarsipkan.
              </p>
            ) : (
              <div className="space-y-3">
                {entity.positions_history.map((pos, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF9F6] border-l-4 border-[#163A5F] space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-data text-xs font-bold text-[#9E1B1B]">
                        {pos.period}
                      </span>
                      <StatusBadge status={pos.status} />
                    </div>
                    <p className="font-semibold text-base text-[#0D0D0D]">
                      {pos.role}
                    </p>
                    <p className="text-sm text-[#3F3D39]">{pos.institution}</p>
                    <p className="font-data text-[11px] text-[#5F5B53]">
                      Rujukan: {pos.source_ref}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Financial History (if entity is one of the 7 BUMN) */}
          {financials.length > 0 && (
            <section className="bg-white border border-[#141414] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D6D1C6] pb-3">
                <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
                  Data Keuangan Konsolidasi Tercatat
                </h2>
                <Link
                  href="/keuangan"
                  className="font-data text-xs font-semibold text-[#9E1B1B] hover:underline"
                >
                  Buka Dashboard Keuangan →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-data text-xs">
                  <thead>
                    <tr className="bg-[#141414] text-white">
                      <th className="p-2.5">Tahun</th>
                      <th className="p-2.5">Total Aset</th>
                      <th className="p-2.5">Laba Bersih</th>
                      <th className="p-2.5">Dividen</th>
                      <th className="p-2.5">Ekuitas</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6D1C6]">
                    {financials.map((f) => (
                      <tr key={f.id}>
                        <td className="p-2.5 font-bold">{f.fiscal_year}</td>
                        <td className="p-2.5">
                          {formatTrillionIdr(f.total_assets_idr_t)}
                        </td>
                        <td className="p-2.5">
                          {formatTrillionIdr(f.net_profit_idr_t)}
                        </td>
                        <td className="p-2.5 font-bold text-[#9E1B1B]">
                          {formatTrillionIdr(f.dividend_idr_t)}
                        </td>
                        <td className="p-2.5">
                          {formatTrillionIdr(f.equity_idr_t)}
                        </td>
                        <td className="p-2.5">{f.data_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Kronologi Entitas */}
          {entity.chronology.length > 0 && (
            <section className="bg-white border border-[#141414] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#D6D1C6] pb-3">
                <Clock className="w-5 h-5 text-[#9E1B1B]" />
                <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
                  Kronologi Peristiwa Terdokumentasi
                </h2>
              </div>
              <ol className="space-y-4 border-l-2 border-[#141414] pl-5">
                {entity.chronology.map((c, idx) => (
                  <li key={idx} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-data text-xs font-bold text-[#9E1B1B]">
                        {formatIndonesianDate(c.date)}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    <h3 className="font-semibold text-base text-[#0D0D0D]">
                      {c.title}
                    </h3>
                    <p className="text-sm text-[#3F3D39] leading-relaxed">
                      {c.description}
                    </p>
                    {c.doc_id && (
                      <Link
                        href={`/dokumen/${c.doc_id}`}
                        className="inline-block font-data text-xs font-semibold text-[#163A5F] hover:underline"
                      >
                        Buka Arsip Sumber: {c.doc_id} →
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Right Column: Linked Articles & Documents */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#141414] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D6D1C6] pb-2.5">
              <Newspaper className="w-4 h-4 text-[#9E1B1B]" />
              <h2 className="font-data text-xs font-bold uppercase tracking-widest">
                LAPORAN TERKAIT ({articles.length})
              </h2>
            </div>
            {articles.length === 0 ? (
              <p className="text-xs text-[#5F5B53]">
                Belum ada artikel yang menautkan entitas ini.
              </p>
            ) : (
              <div className="divide-y divide-[#EFECE6]">
                {articles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/investigasi/${a.slug}`}
                    className="block py-3 first:pt-0 last:pb-0 group"
                  >
                    <StatusBadge status={a.verification_status} />
                    <p className="font-editorial font-bold text-base text-[#0D0D0D] group-hover:text-[#9E1B1B] mt-1.5 leading-snug">
                      {a.title}
                    </p>
                    <p className="font-data text-[11px] text-[#5F5B53] mt-1">
                      {formatIndonesianDate(a.published_at)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#141414] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D6D1C6] pb-2.5">
              <FileText className="w-4 h-4 text-[#163A5F]" />
              <h2 className="font-data text-xs font-bold uppercase tracking-widest">
                DOKUMEN SUMBER ({documents.length})
              </h2>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-[#5F5B53]">
                Tidak ada dokumen khusus tertaut langsung.
              </p>
            ) : (
              <div className="divide-y divide-[#EFECE6]">
                {documents.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dokumen/${d.id}`}
                    className="block py-3 first:pt-0 last:pb-0 group"
                  >
                    <p className="font-data text-[11px] font-bold text-[#9E1B1B]">
                      {d.doc_number} • {d.page_count} HLM
                    </p>
                    <p className="text-sm font-semibold text-[#0D0D0D] group-hover:text-[#9E1B1B] mt-0.5 leading-snug">
                      {d.title}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
