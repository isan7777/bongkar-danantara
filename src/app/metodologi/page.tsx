import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileText, Scale, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { VerificationStatus } from "@/types/domain";
import { getStatusStyles } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodologi Verifikasi, Standar Bukti & Piagam Redaksi",
  description:
    "Bagaimana Bongkar Danantara memisahkan fakta terbukti, catatan terdokumentasi, dugaan, klaim belum terverifikasi, dan bantahan resmi.",
};

const ALL_STATUSES: VerificationStatus[] = [
  "TERBUKTI",
  "TERDOKUMENTASI",
  "DUGAAN",
  "BELUM TERVERIFIKASI",
  "BANTAHAN",
];

export default function MetodologiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <header className="border-b-2 border-[#141414] pb-6 space-y-3">
        <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
          PIAGAM INDEPENDENSI &amp; PROTOKOL PEMBUKTIAN
        </p>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] leading-tight">
          Metodologi Verifikasi dan Standar Redaksi
        </h1>
        <p className="text-lg text-[#2F2E2B] leading-relaxed">
          Tidak ada kekuasaan yang boleh kebal dari pertanyaan. Tidak ada uang
          publik yang boleh luput dari pengawasan. Tidak ada tuduhan yang boleh
          lolos dari pembuktian.
        </p>
      </header>

      {/* 5 Mandatory Labels */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#9E1B1B]" />
          <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
            1. Taksonomi Wajib Lima Label Verifikasi
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#2F2E2B] leading-relaxed">
          Bongkar Danantara melarang keras penyajian dugaan yang belum terbukti
          seolah-olah merupakan fakta hukum final. Setiap publikasi, entri
          timeline, profil entitas, dan temuan wajib menyandang salah satu dari
          lima label berikut:
        </p>
        <div className="divide-y divide-[#D6D1C6] border-2 border-[#141414] bg-white">
          {ALL_STATUSES.map((st) => {
            const info = getStatusStyles(st);
            return (
              <div
                key={st}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="sm:w-48 shrink-0">
                  <StatusBadge status={st} size="md" showTooltip={false} />
                </div>
                <p className="text-sm text-[#1F1E1C] leading-relaxed">
                  {info.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Triangulation Protocol */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#163A5F]" />
          <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
            2. Standar Bukti dan Triangulasi Sumber
          </h2>
        </div>
        <div className="bg-white border border-[#141414] p-6 space-y-3 text-sm sm:text-base text-[#1F1E1C] leading-relaxed">
          <p>
            <strong>Sumber Primer Utama:</strong> Naskah undang-undang (UU No.
            1/2025, UU No. 16/2025), Peraturan Pemerintah (PP No. 10/2025, PP No.
            15/2025), Keputusan Presiden (Keppres No. 30/2025), putusan resmi
            Mahkamah Konstitusi, laporan keuangan teraudit BUMN di Bursa Efek
            Indonesia, serta laporan resmi BPK dan kementerian terkait.
          </p>
          <p>
            <strong>Kewajiban Kutipan &amp; Halaman:</strong> Setiap laporan
            investigasi wajib menyertakan bagian &ldquo;BUKTI DAN SUMBER&rdquo;
            berisi rujukan nomor dokumen, nomor pasal atau halaman, kutipan
            langsung, serta tautan ke salinan PDF di Vault Dokumen Terbuka.
          </p>
          <p>
            <strong>Larangan Mengkriminalisasi Relasi Biasa:</strong> Pencatatan
            afiliasi jabatan, riwayat organisasi, atau hubungan bisnis di Database
            Entitas semata-mata merupakan pemetaan fakta struktural publik untuk
            menilai potensi benturan kepentingan — bukan tuduhan kejahatan.
          </p>
        </div>
      </section>

      {/* Right of Reply & Corrections */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#581C87]" />
          <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
            3. Hak Jawab, Bantahan, dan Koreksi Terbuka
          </h2>
        </div>
        <div className="bg-white border border-[#141414] p-6 space-y-3 text-sm sm:text-base text-[#1F1E1C] leading-relaxed">
          <p>
            Pihak yang disebut dalam investigasi — termasuk manajemen BPI
            Danantara, BP BUMN, direksi BUMN, pejabat negara, maupun perusahaan
            mitra — berhak menyampaikan klarifikasi atau bantahan tertulis secara
            utuh. Bantahan relevan akan ditampilkan langsung pada halaman{" "}
            <Link
              href="/hak-jawab"
              className="text-[#9E1B1B] font-semibold underline"
            >
              Hak Jawab &amp; Bantahan
            </Link>{" "}
            serta ditautkan pada artikel terkait tanpa disembunyikan.
          </p>
          <p>
            Apabila redaksi menemukan kesalahan angka, salah kutip pasal, atau
            perubahan status dokumen hukum, koreksi dicatat secara terbuka dalam
            log &ldquo;Catatan Koreksi &amp; Riwayat Pembaruan&rdquo; pada artikel
            bersangkutan beserta perbandingan teks sebelum dan sesudahnya.
          </p>
        </div>
      </section>

      {/* Honest Whistleblower Security */}
      <section className="bg-[#FAF0F0] border-2 border-[#9E1B1B] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#9E1B1B]" />
          <h2 className="font-editorial text-xl font-bold text-[#781111]">
            4. Kejujuran Batas Teknis Perlindungan Pelapor
          </h2>
        </div>
        <p className="text-sm text-[#1F1E1C] leading-relaxed">
          Kami tidak pernah menjanjikan anonimitas absolut jika infrastruktur
          teknis belum dapat menjaminnya. Formulir laporan publik di situs web ini
          menyimpan lampiran di direktori terisolasi di luar akses publik,
          memvalidasi integritas file dengan SHA-256, dan hanya menampilkan laporan
          kepada editor terautentikasi. Namun, transmisi melalui jaringan internet
          standar tetap dapat meninggalkan jejak di perangkat pengguna atau
          penyedia jaringan lokal. Pelapor dokumen sensitif diimbau menghapus
          metadata dokumen dan membaca seluruh peringatan pada halaman{" "}
          <Link href="/lapor" className="font-bold text-[#9E1B1B] underline">
            Kirim Laporan Publik
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
