import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, Lock, Search } from "lucide-react";
import { WhistleblowerFormClient } from "@/components/WhistleblowerFormClient";

export const metadata: Metadata = {
  title: "Kirim Laporan Publik & Dokumen Rahasia",
  description:
    "Kanal pengiriman laporan dan dokumen pendukung secara rahasia atau anonim bagi masyarakat, pegawai, dan mantan pegawai untuk diverifikasi tim Bongkar Danantara.",
};

export default function LaporPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="bg-[#141414] text-white p-6 sm:p-8 border-b-4 border-[#9E1B1B]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#FCA5A5]">
              <ShieldAlert className="w-4 h-4" />
              KANAL PELAPORAN MASYARAKAT &amp; WHISTLEBLOWER
            </div>
            <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold leading-tight">
              Kirim Laporan Publik &amp; Bukti Dokumen
            </h1>
            <p className="text-sm sm:text-base text-[#D8D4CB] leading-relaxed">
              Punya informasi valid mengenai transaksi tidak transparan, konflik
              kepentingan, pengadaan bermasalah, atau dokumen resmi terkait
              Danantara dan BUMN? Kirimkan ke meja verifikasi kami. Tidak ada
              laporan yang langsung ditayangkan ke publik tanpa pembuktian silang.
            </p>
          </div>
          <Link
            href="/lapor/cek"
            className="inline-flex items-center gap-2 px-4 py-3 bg-[#262522] border border-[#52504A] hover:border-white text-white font-data text-xs font-bold uppercase tracking-wider shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            Cek Status Laporan
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <WhistleblowerFormClient />
        </div>

        {/* Security Honesty & Operational Protection Sidebar (Section 7 mandatory!) */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-[#FAF0F0] border-2 border-[#9E1B1B] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#9E1B1B]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="font-data text-xs font-bold uppercase tracking-widest">
                PERINGATAN KEAMANAN JUJUR
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#1F1E1C] leading-relaxed">
              <strong>
                Jangan pernah menganggap formulir web standar memberikan
                anonimitas absolut.
              </strong>{" "}
              Alamat IP jaringan kantor, riwayat peramban di perangkat perusahaan,
              dan metadata tersembunyi di dalam file PDF/Word dapat membuka
              identitas Anda di luar kendali server kami.
            </p>
          </div>

          <div className="bg-white border border-[#141414] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#163A5F]" />
              <h2 className="font-data text-xs font-bold uppercase tracking-widest text-[#0D0D0D]">
                LANGKAH PERLINDUNGAN PELAPOR
              </h2>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-xs text-[#2F2E2B] leading-relaxed">
              <li>
                Jangan mengirim laporan menggunakan komputer kantor, email dinas,
                atau jaringan Wi-Fi instansi/perusahaan tempat Anda bekerja.
              </li>
              <li>
                Pertimbangkan menggunakan peramban privasi (seperti Tor Browser)
                dan jaringan pribadi untuk informasi berisiko tinggi.
              </li>
              <li>
                Hapus metadata file (nama pembuat dokumen pada properti PDF, data
                EXIF/GPS foto) sebelum mengunggah lampiran.
              </li>
              <li>
                <strong>Jangan unggah data pribadi yang tidak relevan</strong>{" "}
                (NIK/KTP, nomor rekening pribadi, alamat keluarga, atau data medis
                pihak ketiga).
              </li>
              <li>
                Simpan <strong>Kode Pelacakan</strong> dan{" "}
                <strong>PIN Akses</strong> setelah mengirim laporan untuk memantau
                tanggapan redaksi tanpa perlu membuka identitas Anda.
              </li>
            </ol>
          </div>

          <div className="bg-[#EFECE6] border border-[#D6D1C6] p-5 space-y-2">
            <h3 className="font-data text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              ALUR MODERASI &amp; VERIFIKASI
            </h3>
            <p className="text-xs text-[#3F3D39] leading-relaxed">
              Setiap laporan masuk berstatus <strong>DITERIMA</strong> di antrean
              internal redaksi, lalu diverifikasi keaslian dokumennya
              (<strong>VERIFIKASI AWAL</strong>), diperiksa silang dengan sumber
              independen (<strong>INVESTIGASI LANJUT</strong>), dan dimintakan
              hak jawab kepada pihak terkait sebelum dipublikasikan.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
