import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
        KODE ARSIP 404
      </p>
      <h1 className="font-editorial text-4xl font-extrabold text-[#0D0D0D]">
        Dokumen atau Halaman Tidak Ditemukan
      </h1>
      <p className="text-sm text-[#3F3D39]">
        Tautan yang Anda buka mungkin telah berpindah atau belum tersedia dalam
        arsip publik Bongkar Danantara.
      </p>
      <div className="pt-3 flex justify-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase"
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/cari"
          className="px-5 py-2.5 border border-[#141414] font-data text-xs font-bold uppercase"
        >
          Cari di Arsip
        </Link>
      </div>
    </div>
  );
}
