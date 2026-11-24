import type { Metadata } from "next";
import Link from "next/link";
import { GitCompare } from "lucide-react";
import { listDocuments } from "@/lib/db/queries";
import { DocumentsListClient } from "@/components/DocumentsListClient";

export const metadata: Metadata = {
  title: "Vault Dokumen Terbuka & Arsip PDF",
  description:
    "Baca PDF, periksa kutipan dan nomor halaman, unduh dokumen publik, dan bandingkan laporan antarperiode terkait Danantara Indonesia.",
};

export default function DocumentsPage() {
  const documents = listDocuments();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-2 border-[#141414] pb-5 mb-7">
        <div>
          <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
            PUSAT BUKTI &amp; DOKUMENTASI
          </p>
          <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] mt-1">
            Vault Dokumen Terbuka &amp; PDF
          </h1>
          <p className="mt-2 text-base text-[#3F3D39] max-w-3xl">
            Buka dokumen PDF langsung di peramban, periksa kutipan beserta nomor
            halaman, verifikasi hash SHA-256, akses sumber resmi, atau bandingkan
            laporan antarperiode.
          </p>
        </div>

        <Link
          href="/dokumen/bandingkan"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#163A5F] hover:bg-[#0F2944] text-white font-data text-xs font-bold uppercase tracking-wider shrink-0 transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          Bandingkan Laporan Antarperiode
        </Link>
      </div>

      <DocumentsListClient documents={documents} />
    </div>
  );
}
