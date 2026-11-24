import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  listArticles,
  listCategories,
} from "@/lib/db/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIndonesianDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";

export function generateStaticParams() {
  return listCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Kategori Tidak Ditemukan" };
  return {
    title: `${category.code}. ${category.name}`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = listArticles({ category: category.slug });
  const allCategories = listCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-[#141414] text-[#F7F6F2] p-6 sm:p-8 border-b-4 border-[#9E1B1B] mb-8">
        <p className="font-data text-xs font-bold uppercase tracking-widest text-[#FCA5A5]">
          DESK INVESTIGASI // KATEGORI {category.code}
        </p>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold mt-2">
          {category.name}
        </h1>
        <p className="mt-3 text-base text-[#D8D4CB] max-w-3xl leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Category Switcher */}
      <div className="flex flex-wrap gap-2 mb-8">
        {allCategories.map((c) => (
          <Link
            key={c.slug}
            href={`/kategori/${c.slug}`}
            className={`px-3 py-1.5 font-data text-xs border transition-colors ${
              c.slug === category.slug
                ? "bg-[#9E1B1B] text-white border-[#9E1B1B] font-bold"
                : "bg-white text-[#0D0D0D] border-[#D6D1C6] hover:border-[#141414]"
            }`}
          >
            {c.code}. {c.name} ({c.article_count ?? 0})
          </Link>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="bg-white border border-[#D6D1C6] p-8 text-center">
          <p className="font-editorial text-lg font-bold">
            Belum ada laporan terpublikasi di desk ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((art) => (
            <article
              key={art.id}
              className="bg-white border border-[#141414] flex flex-col justify-between"
            >
              <div>
                {art.cover_image && (
                  <Link href={`/investigasi/${art.slug}`} className="block border-b border-[#141414]">
                    <img
                      src={withBasePath(art.cover_image)}
                      alt={art.title}
                      className="w-full h-auto block"
                    />
                  </Link>
                )}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={art.verification_status} size="md" />
                    <span className="font-data text-[11px] text-[#5F5B53]">
                      {formatIndonesianDate(art.published_at)}
                    </span>
                  </div>
                  <Link href={`/investigasi/${art.slug}`} className="group block">
                    <h2 className="font-editorial text-2xl font-extrabold text-[#0D0D0D] group-hover:text-[#9E1B1B] leading-snug">
                      {art.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-[#2F2E2B] leading-relaxed">
                    {art.subtitle}
                  </p>
                </div>
              </div>
              <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#D6D1C6] flex items-center justify-between font-data text-xs">
                <span className="text-[#5F5B53]">{art.reading_time_min} menit baca</span>
                <Link
                  href={`/investigasi/${art.slug}`}
                  className="font-bold text-[#9E1B1B] hover:underline"
                >
                  Baca Lengkap &amp; Bukti →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
