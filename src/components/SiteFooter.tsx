import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#121210] text-[#E8E4DC] border-t-4 border-[#9E1B1B] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#2E2D29]">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2.5 h-7 bg-[#9E1B1B]" />
              <span className="font-editorial text-2xl font-extrabold tracking-tight text-[#F7F6F2]">
                BONGKAR DANANTARA
              </span>
            </div>
            <p className="font-data text-xs text-[#D6D1C6]">
              Uang Rakyat, Kekuasaan Besar, Transparansi Harus Dibuka.
            </p>
            <p className="text-sm text-[#A6A197] leading-relaxed">
              Platform investigasi, dokumentasi, dan pengawasan publik independen.
              Kami memisahkan secara tegas antara fakta terbukti, catatan
              terdokumentasi, dugaan yang memerlukan pembuktian, klaim yang belum
              terverifikasi, serta hak jawab pihak terkait.
            </p>
            <blockquote className="border-l-2 border-[#9E1B1B] pl-3.5 text-xs font-data text-[#F7F6F2] leading-relaxed">
              Tidak ada kekuasaan yang boleh kebal dari pertanyaan. Tidak ada uang
              publik yang boleh luput dari pengawasan. Tidak ada tuduhan yang boleh
              lolos dari pembuktian.
            </blockquote>
          </div>

          <div className="md:col-span-2 space-y-2.5">
            <h3 className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
              Desk Investigasi
            </h3>
            <ul className="space-y-1.5 text-sm text-[#C7C2B6]">
              <li>
                <Link href="/kategori/jejak-uang" className="hover:text-white">
                  A. Jejak Uang
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/siapa-di-balik-kekuasaan"
                  className="hover:text-white"
                >
                  B. Siapa di Balik Kekuasaan?
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/dokumen-terbuka"
                  className="hover:text-white"
                >
                  C. Dokumen Terbuka
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/konflik-kepentingan"
                  className="hover:text-white"
                >
                  D. Konflik Kepentingan
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/kebijakan-bermasalah"
                  className="hover:text-white"
                >
                  E. Kebijakan Bermasalah
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/investigasi-mendalam"
                  className="hover:text-white"
                >
                  F. Investigasi Mendalam
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-2.5">
            <h3 className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
              Pusat Data & Bukti
            </h3>
            <ul className="space-y-1.5 text-sm text-[#C7C2B6]">
              <li>
                <Link href="/database" className="hover:text-white">
                  Database Entitas
                </Link>
              </li>
              <li>
                <Link href="/dokumen" className="hover:text-white">
                  Vault Dokumen PDF
                </Link>
              </li>
              <li>
                <Link href="/dokumen/bandingkan" className="hover:text-white">
                  Bandingkan Laporan
                </Link>
              </li>
              <li>
                <Link href="/keuangan" className="hover:text-white">
                  Analisis Keuangan
                </Link>
              </li>
              <li>
                <Link href="/timeline" className="hover:text-white">
                  Timeline Keputusan
                </Link>
              </li>
              <li>
                <Link href="/cari" className="hover:text-white">
                  Pencarian Global
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
              Partisipasi & Akuntabilitas
            </h3>
            <ul className="space-y-1.5 text-sm text-[#C7C2B6]">
              <li>
                <Link
                  href="/lapor"
                  className="text-white font-semibold hover:text-[#FCA5A5]"
                >
                  Kirim Laporan Publik / Dokumen
                </Link>
              </li>
              <li>
                <Link href="/lapor/cek" className="hover:text-white">
                  Cek Status Laporan Pelapor
                </Link>
              </li>
              <li>
                <Link href="/hak-jawab" className="hover:text-white">
                  Hak Jawab, Bantahan & Koreksi
                </Link>
              </li>
              <li>
                <Link href="/metodologi" className="hover:text-white">
                  Metodologi Verifikasi & Standar Bukti
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white">
                  Dashboard Redaksi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-data text-[#8C877D]">
          <p>
            BONGKAR DANANTARA — Arsip Pengawasan Publik Independen. Bukan media
            afiliasi pemerintah maupun korporasi.
          </p>
          <p>
            Label Wajib: TERBUKTI • TERDOKUMENTASI • DUGAAN • BELUM TERVERIFIKASI • BANTAHAN
          </p>
        </div>
      </div>
    </footer>
  );
}
