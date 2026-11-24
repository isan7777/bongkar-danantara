import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";
import { listDocuments, listFinancialRecords } from "@/lib/db/queries";
import { CompareReportsClient } from "@/components/CompareReportsClient";

export const metadata: Metadata = {
  title: "Bandingkan Laporan Antarperiode & Regulasi",
  description:
    "Alat perbandingan neraca 7 BUMN (2023 vs 2024), perubahan pasal UU No. 1/2025 vs UU No. 16/2025, serta perbandingan dua dokumen arsip berdampingan.",
};

export default function CompareDocumentsPage() {
  const financials = listFinancialRecords();
  const documents = listDocuments();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="border-b border-[#D6D1C6] pb-3 font-data text-xs">
        <Link
          href="/dokumen"
          className="inline-flex items-center gap-1.5 text-[#5F5B53] hover:text-[#9E1B1B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Vault Dokumen Terbuka
        </Link>
      </div>

      <header className="border-b-2 border-[#141414] pb-5">
        <div className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#163A5F]">
          <GitCompare className="w-4 h-4" />
          ALAT PERBANDINGAN DOKUMEN &amp; ANTARPERIODE
        </div>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] mt-1">
          Bandingkan Laporan Keuangan &amp; Perubahan Regulasi
        </h1>
        <p className="mt-2 text-base text-[#3F3D39] max-w-3xl">
          Periksa pergeseran angka aset, laba bersih, dividen antar tahun buku,
          perbedaan pasal antara UU No. 1/2025 dan UU No. 16/2025, serta sandingan
          dua dokumen arsip secara langsung.
        </p>
      </header>

      <CompareReportsClient financials={financials} documents={documents} />
    </div>
  );
}
