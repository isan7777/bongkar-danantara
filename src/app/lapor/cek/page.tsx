import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportStatusCheckerClient } from "@/components/ReportStatusCheckerClient";

export const metadata: Metadata = {
  title: "Cek Status Laporan Pelapor",
  description:
    "Pantau progres moderasi dan catatan meja verifikasi redaksi secara anonim menggunakan Kode Pelacakan dan PIN Akses.",
};

export default function CekLaporanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/lapor"
        className="inline-flex items-center gap-1.5 font-data text-xs text-[#5F5B53] hover:text-[#9E1B1B]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Formulir Kirim Laporan
      </Link>

      <header className="border-b-2 border-[#141414] pb-4">
        <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
          PEMANTAUAN ANONIM PELAPOR
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#0D0D0D] mt-1">
          Cek Status Moderasi Laporan
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#3F3D39]">
          Masukkan Kode Pelacakan dan PIN Akses yang Anda terima saat mengirim
          laporan. PIN diverifikasi secara terenkripsi (hash satu arah).
        </p>
      </header>

      <ReportStatusCheckerClient />
    </div>
  );
}
