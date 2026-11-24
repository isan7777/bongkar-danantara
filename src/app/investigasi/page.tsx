import type { Metadata } from "next";
import { listArticles, listCategories } from "@/lib/db/queries";
import { InvestigasiListClient } from "@/components/InvestigasiListClient";

export const metadata: Metadata = {
  title: "Semua Laporan Investigasi",
  description:
    "Indeks lengkap laporan investigasi independen Bongkar Danantara berdasarkan kategori dan status pembuktian.",
};

export default function InvestigasiPage() {
  const categories = listCategories();
  const articles = listArticles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="border-b-2 border-[#141414] pb-5 mb-8">
        <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
          ARSIP LAPORAN REDAKSI
        </p>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] mt-1">
          Laporan Investigasi Danantara
        </h1>
        <p className="mt-2 text-base text-[#3F3D39] max-w-3xl">
          Setiap laporan dilengkapi pemisahan tegas antara fakta, analisis, dugaan,
          pertanyaan terbuka, daftar bukti dan nomor halaman sumber, serta hak jawab
          pihak terkait.
        </p>
      </div>

      <InvestigasiListClient articles={articles} categories={categories} />
    </div>
  );
}
