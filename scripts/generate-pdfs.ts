import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PdfArchiveSpec {
  id: string;
  slug: string;
  title: string;
  doc_number: string;
  issuer: string;
  published_date: string;
  period_year: number;
  doc_type:
    | "REGULASI"
    | "LAPORAN_KEUANGAN"
    | "KEPUTUSAN_PRESIDEN"
    | "PUTUSAN_MK"
    | "LAPORAN_TAHUNAN"
    | "ANALISIS_DATA";
  original_source_url: string;
  verification_status: "TERBUKTI" | "TERDOKUMENTASI" | "BELUM TERVERIFIKASI";
  comparison_group: string | null;
  summary: string;
  pages: Array<{
    page: number;
    heading: string;
    paragraphs: string[];
  }>;
  key_citations: Array<{
    page: number;
    section: string;
    quote: string;
    analysis_note: string;
  }>;
}

export const PDF_SPECS: PdfArchiveSpec[] = [
  {
    id: "DOC-UU-01-2025",
    slug: "uu-nomor-1-tahun-2025-perubahan-ketiga-uu-bumn",
    title:
      "Ringkasan Terkurasi & Ekstrak Pasal Kunci UU Nomor 1 Tahun 2025 tentang Perubahan Ketiga atas UU BUMN",
    doc_number: "UU No. 1 Tahun 2025",
    issuer: "Dewan Perwakilan Rakyat RI & Presiden RI (Lembaran Negara RI)",
    published_date: "2025-02-24",
    period_year: 2025,
    doc_type: "REGULASI",
    original_source_url: "https://peraturan.bpk.go.id/",
    verification_status: "TERBUKTI",
    comparison_group: "REGULASI_BUMN_2025",
    summary:
      "Kompilasi terdokumentasi atas pasal-pasal utama dalam UU Nomor 1 Tahun 2025 yang membentuk BPI Danantara sebagai badan hukum sui generis, menetapkan modal awal minimum Rp1.000 triliun, mengatur pemisahan kerugian badan/BUMN dari kerugian negara, serta status organ dan pegawai Danantara.",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — LANDASAN PEMBENTUKAN & MODAL AWAL BPI DANANTARA",
        paragraphs: [
          "ARSIP DOKUMENTASI PUBLIK BONGKAR DANANTARA — DOKUMEN REFERENSI UU NO. 1 TAHUN 2025.",
          "Undang-Undang Nomor 1 Tahun 2025 tentang Perubahan Ketiga atas Undang-Undang Nomor 19 Tahun 2003 tentang Badan Usaha Milik Negara disahkan DPR RI pada 4 Februari 2025 dan diundangkan pada 24 Februari 2025.",
          "Bab Pembentukan Badan Pengelola Investasi Daya Anagata Nusantara (Danantara) menetapkan Danantara sebagai badan hukum khusus (sui generis) yang bertugas melaksanakan pengelolaan BUMN dan investasi strategis nasional secara terpusat.",
          "Ketentuan Modal Awal: Modal awal BPI Danantara ditetapkan paling sedikit sebesar Rp1.000.000.000.000.000 (seribu triliun rupiah) yang bersumber dari penyertaan modal negara (termasuk pengalihan saham BUMN/inbreng) dan sumber lain yang sah sesuai peraturan perundang-undangan.",
          "Dalam struktur kepemilikan, Danantara membentuk Holding Investasi dan Holding Operasional untuk memisahkan pengelolaan operasional BUMN dengan fungsi penempatan modal investasi jangka panjang.",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — PASAL 3H AYAT (2) & PASAL 4B: STATUS KEUNTUNGAN DAN KERUGIAN",
        paragraphs: [
          "EKSTRAK SUBSTANSI PASAL KRUSIAL YANG MENJADI SOROTAN PENGAWASAN PUBLIK:",
          "1. Pasal 3H ayat (2): Keuntungan atau kerugian yang dialami Badan (Danantara) dalam melaksanakan investasi merupakan keuntungan atau kerugian Badan.",
          "2. Pasal 4B: Keuntungan atau kerugian yang dialami BUMN merupakan keuntungan atau kerugian BUMN.",
          "3. Implikasi Hukum: Rumusan ini memisahkan kerugian korporasi dari definisi langsung kerugian keuangan negara sepanjang keputusan bisnis diambil dengan iktikad baik, penuh kehati-hatian, dan tanpa benturan kepentingan (doktrin Business Judgment Rule).",
          "4. Catatan Kritis Akademisi & Masyarakat Sipil: Sejumlah pakar hukum tata negara dan pemohon uji materi di Mahkamah Konstitusi menilai frasa tersebut membuka celah interpretasi yang dapat menyulitkan pembuktian delik kerugian keuangan negara dalam penegakan hukum tindak pidana korupsi apabila tidak dibarengi mekanisme transparansi penuh.",
        ],
      },
      {
        page: 3,
        heading: "HALAMAN 3 — PASAL 3X AYAT (1), PASAL 9G & PASAL 87 AYAT (5): STATUS PENYELENGGARA NEGARA",
        paragraphs: [
          "KETENTUAN STATUS HUKUM ORGAN, DIREKSI, KOMISARIS, DAN PEGAWAI:",
          "1. Pasal 3X ayat (1): Organ dan pegawai Badan (Danantara) bukan merupakan penyelenggara negara.",
          "2. Pasal 9G: Anggota Direksi, Dewan Komisaris, dan Dewan Pengawas BUMN bukan merupakan penyelenggara negara.",
          "3. Pasal 87 ayat (5): Karyawan BUMN sebagaimana dimaksud pada ayat sebelumnya bukan merupakan penyelenggara negara.",
          "4. Catatan Audit & Kewenangan Penegak Hukum: Pemerintah dan manajemen Danantara menyatakan bahwa ketentuan tersebut tidak membuat Danantara kebal hukum dan menegaskan BPK serta KPK tetap memiliki kewenangan memeriksa dugaan tindak pidana atau pengelolaan dana publik. Namun, sejumlah pengamat menyoroti perlunya kejelasan norma kewajiban pelaporan harta kekayaan (LHKPN) dan definisi gratifikasi bagi pejabat non-penyelenggara negara.",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Ketentuan Modal Awal BPI Danantara",
        quote:
          "Modal awal BPI Danantara ditetapkan paling sedikit sebesar Rp1.000 triliun yang bersumber dari penyertaan modal negara dan pengalihan saham BUMN.",
        analysis_note:
          "Menjadi dasar konsolidasi aset BUMN skala besar di luar mekanisme belanja tahunan APBN.",
      },
      {
        page: 2,
        section: "Pasal 3H ayat (2) & Pasal 4B",
        quote:
          "Keuntungan atau kerugian yang dialami Badan dalam melaksanakan investasi merupakan keuntungan atau kerugian Badan; keuntungan atau kerugian BUMN merupakan keuntungan atau kerugian BUMN.",
        analysis_note:
          "Inti perdebatan hukum antara fleksibilitas Business Judgment Rule dan akuntabilitas kerugian keuangan negara.",
      },
      {
        page: 3,
        section: "Pasal 3X ayat (1) & Pasal 9G",
        quote:
          "Organ dan pegawai Badan serta Anggota Direksi, Dewan Komisaris, dan Dewan Pengawas BUMN bukan merupakan penyelenggara negara.",
        analysis_note:
          "Digugat dalam beberapa perkara uji materi di Mahkamah Konstitusi pada 2025 terkait celah pengawasan gratifikasi dan LHKPN.",
      },
    ],
  },
  {
    id: "DOC-PP-10-2025",
    slug: "pp-nomor-10-tahun-2025-organisasi-tata-kelola-danantara",
    title:
      "Ringkasan Terkurasi PP Nomor 10 Tahun 2025 tentang Organisasi dan Tata Kelola BPI Danantara",
    doc_number: "PP No. 10 Tahun 2025",
    issuer: "Pemerintah Republik Indonesia (Sekretariat Negara)",
    published_date: "2025-02-24",
    period_year: 2025,
    doc_type: "REGULASI",
    original_source_url: "https://peraturan.bpk.go.id/",
    verification_status: "TERBUKTI",
    comparison_group: "TATA_KELOLA_DANANTARA",
    summary:
      "Peraturan pelaksana yang menetapkan arsitektur organ BPI Danantara, pembagian wewenang antara Dewan Pengawas dan Badan Pelaksana, mekanisme pertanggungjawaban langsung kepada Presiden, serta tata kelola Holding Investasi dan Holding Operasional.",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — STRUKTUR ORGAN DAN GARIS PERTANGGUNGJAWABAN",
        paragraphs: [
          "PP Nomor 10 Tahun 2025 ditetapkan bersamaan dengan peluncuran resmi BPI Danantara pada 24 Februari 2025.",
          "Organ BPI Danantara terdiri atas Dewan Pengawas dan Badan Pelaksana yang berkedudukan di bawah dan bertanggung jawab langsung kepada Presiden Republik Indonesia.",
          "Dewan Pengawas bertugas melakukan pengawasan terhadap penyelenggaraan pengelolaan investasi dan operasional yang dijalankan oleh Badan Pelaksana, termasuk menyetujui rencana kerja dan anggaran tahunan badan.",
          "Badan Pelaksana dipimpin oleh Kepala Badan (Group CEO) dibantu pimpinan bidang operasional (COO) dan bidang investasi (CIO), serta jajaran direktur pelaksana (Managing Director).",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — PEMISAHAN HOLDING OPERASIONAL DAN HOLDING INVESTASI",
        paragraphs: [
          "PP No. 10 Tahun 2025 mengamanatkan dua pilar korporasi utama di bawah Danantara:",
          "1. Holding Operasional (Danantara Asset Management / DAM): Berfokus pada pengelolaan operasional, restrukturisasi, konsolidasi, dan peningkatan efisiensi perusahaan-perusahaan BUMN.",
          "2. Holding Investasi (Danantara Investment Management / DIM): Berfokus pada pengelolaan dividen, penempatan modal investasi, kerja sama pendanaan strategis, dan ekspansi portofolio.",
          "Catatan Pengawasan: PP ini belum merinci standar keterbukaan informasi per transaksi investasi (transaction-level disclosure), daftar mitra co-investment swasta, maupun tenggat publikasi rincian remunerasi pengurus dan penasihat global.",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Struktur Organ & Pertanggungjawaban",
        quote:
          "Organ BPI Danantara terdiri atas Dewan Pengawas dan Badan Pelaksana yang bertanggung jawab langsung kepada Presiden Republik Indonesia.",
        analysis_note:
          "Memusatkan garis komando langsung di bawah Presiden tanpa mekanisme persetujuan DPR pada setiap keputusan investasi.",
      },
      {
        page: 2,
        section: "Pilar Dual-Holding",
        quote:
          "Pengelolaan dibagi ke dalam Holding Operasional untuk konsolidasi BUMN dan Holding Investasi untuk penempatan modal serta dividen.",
        analysis_note:
          "Membutuhkan sekat tata kelola (firewall) yang tegas agar dividen BUMN sehat tidak menambal proyek berisiko tinggi tanpa keterbukaan.",
      },
    ],
  },
  {
    id: "DOC-KEPPRES-30-2025",
    slug: "keppres-30-2025-pengangkatan-pengurus-dan-struktur-maret-2025",
    title:
      "Kompilasi Keppres Nomor 30 Tahun 2025 & Pengumuman Resmi Struktur Kepengurusan BPI Danantara",
    doc_number: "Keppres No. 30 Tahun 2025",
    issuer: "Presiden Republik Indonesia & BPI Danantara",
    published_date: "2025-03-24",
    period_year: 2025,
    doc_type: "KEPUTUSAN_PRESIDEN",
    original_source_url: "https://www.setneg.go.id/",
    verification_status: "TERDOKUMENTASI",
    comparison_group: "TATA_KELOLA_DANANTARA",
    summary:
      "Catatan terdokumentasi atas pengangkatan pimpinan inti BPI Danantara pada 24 Februari 2025 serta pengumuman struktur lengkap Dewan Pengarah, Dewan Pengawas, Dewan Penasihat Global, Badan Pelaksana, dan Komite Pengawasan pada 24 Maret 2025.",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — BADAN PELAKSANA DAN DEWAN PENGAWAS (KEPPRES 30/2025)",
        paragraphs: [
          "Pada 24 Februari 2025, Presiden Prabowo Subianto menandatangani Keputusan Presiden Nomor 30 Tahun 2025 tentang Pengangkatan Dewan Pengawas dan Badan Pelaksana BPI Danantara.",
          "Susunan Badan Pelaksana Inti:",
          "- Rosan Perkasa Roeslani sebagai Group CEO (pada saat pengangkatan juga menjabat sebagai Menteri Investasi dan Hilirisasi / Kepala BKPM).",
          "- Dony Oskaria sebagai Chief Operating Officer / COO (pada saat pengangkatan juga menjabat sebagai Wakil Menteri BUMN).",
          "- Pandu Patria Sjahrir sebagai Chief Investment Officer / CIO.",
          "Susunan Dewan Pengawas Inti: Erick Thohir (Ketua, Menteri BUMN), Muliaman D. Hadad (Wakil Ketua), serta unsur Menteri Keuangan (Sri Mulyani Indrawati), Menteri Koordinator, dan Menteri Sekretaris Negara.",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — DEWAN PENGARAH, PENASIHAT GLOBAL, DAN KOMITE PENGAWASAN (24 MARET 2025)",
        paragraphs: [
          "Pada 24 Maret 2025, Danantara mengumumkan kelengkapan struktur kelembagaan:",
          "Dewan Pengarah: Mantan Presiden Susilo Bambang Yudhoyono dan Joko Widodo.",
          "Dewan Penasihat (Board of Advisors): Ray Dalio (Bridgewater Associates), Helman Sitohang (mantan CEO Asia Pasifik Credit Suisse), Jeffrey Sachs (Columbia University), F. Chapman Taylor (Capital Group), dan Thaksin Shinawatra (mantan PM Thailand).",
          "Komite Pengawasan dan Akuntabilitas: Melibatkan unsur pimpinan PPATK, KPK, BPK, BPKP, Kapolri, dan Jaksa Agung.",
          "Managing Director: Robertus Billitea (Legal), Lieng-Seng Wee (Risk & Sustainability), Arief Budiman (Finance), Ali Setiawan (Treasury), Mohamad Al-Arief (Global Relations & Governance), Rohan Hafas (Stakeholders Management), Ahmad Hidayat (Internal Audit), Sanjay Bharwani (HR), Reza Yamora Siregar (Chief Economist), dan Ivy Santoso (Head of Office).",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Rangkap Jabatan Pimpinan Eksekutif",
        quote:
          "Rosan Roeslani menjabat sebagai Group CEO Danantara sekaligus Menteri Investasi dan Hilirisasi; Dony Oskaria sebagai COO sekaligus Wakil Menteri BUMN.",
        analysis_note:
          "Memicu kajian yuridis mengenai potensi disharmonisasi dengan prinsip larangan rangkap jabatan pejabat negara dalam UU Kementerian Negara.",
      },
      {
        page: 2,
        section: "Dewan Penasihat Global & Komite Pengawasan",
        quote:
          "Penempatan lima penasihat global serta keterlibatan pimpinan KPK, BPK, BPKP, PPATK, Polri, dan Kejagung dalam Komite Pengawasan.",
        analysis_note:
          "Menimbulkan pertanyaan publik mengenai rincian kontrak/remunerasi penasihat global serta potensi benturan independensi aparat penegak hukum.",
      },
    ],
  },
  {
    id: "DOC-BUMN-FIN-2024",
    slug: "kompilasi-neraca-dan-dividen-7-bumn-utama-2023-2024",
    title:
      "Kompilasi Data Keuangan Konsolidasi 7 BUMN Utama Danantara (Tahun Buku 2023 vs 2024)",
    doc_number: "BD-DATA-FIN-2024",
    issuer: "Kompilasi Redaksi dari Laporan Keuangan Tahunan 7 BUMN & Rilis Kementerian BUMN",
    published_date: "2025-03-10",
    period_year: 2024,
    doc_type: "LAPORAN_KEUANGAN",
    original_source_url: "https://www.idx.co.id/",
    verification_status: "TERDOKUMENTASI",
    comparison_group: "NERACA_7_BUMN",
    summary:
      "Rekapitulasi data aset bruto, laba bersih tahun buku 2023-2024, serta realisasi setoran dividen 2024 dari tujuh BUMN strategis awal Danantara (Bank Mandiri, BRI, PLN, Pertamina, BNI, MIND ID, dan Telkom Indonesia).",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — RINGKASAN ASET BRUTO 7 BUMN UTAMA (FY 2024)",
        paragraphs: [
          "Berdasarkan laporan keuangan konsolidasian tahun buku 2024 yang dipublikasikan masing-masing entitas dan rangkuman pasar modal, total aset bruto gabungan tujuh BUMN awal Danantara mencapai Rp9.353,40 triliun:",
          "1. PT Bank Mandiri (Persero) Tbk (BMRI): Aset Rp2.427,22 T | Laba Bersih 2024 Rp55,80 T | Dividen 2024 Rp17,10 T.",
          "2. PT Bank Rakyat Indonesia (Persero) Tbk (BBRI): Aset Rp1.992,98 T | Laba Bersih 2024 Rp60,64 T | Dividen 2024 Rp25,70 T.",
          "3. PT PLN (Persero): Aset Rp1.699,06 T | Dividen 2024 Rp3,00 T.",
          "4. PT Pertamina (Persero): Aset Rp1.526,98 T | Laba Bersih 2024 ~Rp45,50 T (vs 2023 Rp66,11 T) | Dividen 2024 Rp9,30 T.",
          "5. PT Bank Negara Indonesia (Persero) Tbk (BBNI): Aset Rp1.129,80 T | Laba Bersih 2024 Rp21,50 T | Dividen 2024 Rp6,20 T.",
          "6. PT Mineral Industri Indonesia / MIND ID: Aset Rp292,23 T | Laba Bersih 2024 Rp40,20 T (vs 2023 Rp27,50 T) | Dividen 2024 Rp11,20 T.",
          "7. PT Telkom Indonesia (Persero) Tbk (TLKM): Aset Rp285,13 T | Dividen 2024 Rp9,20 T.",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — ANALISIS KUALITAS ASET & KONSENTRASI DIVIDEN",
        paragraphs: [
          "Temuan 1 — Dominasi Aset Perbankan (59,3%): Tiga bank Himbara (Mandiri, BRI, BNI) menyumbang Rp5.550,00 triliun atau 59,3% dari total aset bruto tujuh BUMN tersebut. Dalam akuntansi perbankan, mayoritas aset bank berasal dari liabilitas berupa Dana Pihak Ketiga (simpanan nasabah) yang wajib dijaga likuiditas dan rasio kecukupan modalnya — bukan dana kas bebas yang dapat langsung diinvestasikan ke proyek jangka panjang.",
          "Temuan 2 — Selisih Klaim AUM: Pemerintah memproyeksikan total Asset Under Management (AUM) Danantara menembus US$900 miliar (~Rp14.700 triliun) dengan memasukkan aset negara lain seperti kawasan GBK dan seluruh konsolidasi BUMN. Hingga kini, tabel valuasi rinci per aset penyusun angka US$900 miliar tersebut belum dirilis terbuka kepada publik.",
          "Temuan 3 — Konsentrasi Dividen (95,6%): Dari total setoran dividen seluruh BUMN tahun 2024 sebesar Rp85,5 triliun, ketujuh BUMN utama ini menyumbang Rp81,7 triliun atau 95,6%. Pengalihan aliran dividen dari APBN ke pool investasi Danantara menuntut transparansi baru pengganti mekanisme pengawasan anggaran DPR.",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Total Aset Konsolidasi 7 BUMN FY 2024",
        quote:
          "Gabungan total aset bruto 7 BUMN utama mencapai Rp9.353,40 triliun dengan Bank Mandiri (Rp2.427,22 T) dan BRI (Rp1.992,98 T) di posisi teratas.",
        analysis_note:
          "Menunjukkan jarak signifikan dibandingkan narasi publik US$900 miliar (~Rp14.700 triliun) yang belum dirinci metodologi penghitungannya.",
      },
      {
        page: 2,
        section: "Porsi Aset Perbankan & Dividen",
        quote:
          "Tiga bank Himbara mencakup 59,3% aset (mayoritas dana nasabah/DPK), sementara 7 BUMN menyumbang Rp81,7 triliun (95,6%) dari Rp85,5 triliun dividen BUMN 2024.",
        analysis_note:
          "Membuktikan bahwa modal tunai siap investasi Danantara jauh lebih kecil daripada angka total aset bruto konsolidasi.",
      },
    ],
  },
  {
    id: "DOC-PP-15-2025",
    slug: "pp-nomor-15-tahun-2025-inbreng-saham-bki-holding-operasional",
    title:
      "Ringkasan Terkurasi PP Nomor 15 Tahun 2025 tentang Pengalihan Saham BUMN (Inbreng) ke PT Biro Klasifikasi Indonesia",
    doc_number: "PP No. 15 Tahun 2025",
    issuer: "Pemerintah Republik Indonesia",
    published_date: "2025-03-21",
    period_year: 2025,
    doc_type: "REGULASI",
    original_source_url: "https://peraturan.bpk.go.id/",
    verification_status: "TERBUKTI",
    comparison_group: "REGULASI_BUMN_2025",
    summary:
      "Regulasi penambahan penyertaan modal negara melalui skema inbreng saham Seri B dan Seri C ratusan BUMN ke PT Biro Klasifikasi Indonesia (Persero) sebagai kendaraan Holding Operasional Danantara.",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — PENUNJUKAN PT BIRO KLASIFIKASI INDONESIA (BKI)",
        paragraphs: [
          "Melalui PP Nomor 15 Tahun 2025, pemerintah menetapkan PT Biro Klasifikasi Indonesia (Persero) atau BKI sebagai kendaraan utama Holding Operasional di bawah Danantara (Danantara Asset Management).",
          "Alasan resmi yang disampaikan pemerintah adalah kondisi neraca BKI yang relatif bersih dan tidak dibebani utang korporasi besar dibandingkan sejumlah BUMN karya atau infrastruktur.",
          "Skema inbreng mengalihkan kepemilikan Saham Seri B dan Seri C milik negara pada perusahaan-perusahaan BUMN ke BKI, sementara negara tetap mempertahankan Saham Seri A Dwiwarna sebagai instrumen hak kendali strategis.",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — RESTRUKTURISASI, PAJAK, DAN KETERBUKAAN PUBLIK",
        paragraphs: [
          "Pascakonsolidasi, Danantara menghadapi mandat penataan lebih dari 800 entitas BUMN beserta anak dan cucu perusahaannya, termasuk penyelesaian ratusan kasus utang-piutang antar-BUMN (inter-company liabilities).",
          "Pemerintah juga menerbitkan fasilitas insentif perpajakan terkait restrukturisasi korporasi agar pengalihan saham tidak memicu beban pajak transaksi yang menggerus likuiditas BUMN.",
          "Isu Transparansi Terbuka: Publik dan pemegang saham minoritas emiten BUMN Tbk membutuhkan publikasi lengkap dokumen penilaian independen (appraisal) atas transaksi inbreng serta daftar anak/cucu perusahaan yang direncanakan untuk dilikuidasi atau dimerger.",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Skema Pengalihan Saham (Inbreng)",
        quote:
          "Saham Seri B dan Seri C milik negara pada BUMN dialihkan melalui inbreng ke PT BKI sebagai Holding Operasional, sementara kendali strategis tetap pada Saham Seri A Dwiwarna.",
        analysis_note:
          "Mengubah struktur kepemilikan langsung negara menjadi struktur holding berlapis.",
      },
      {
        page: 2,
        section: "Konsolidasi 800+ Entitas & Insentif Pajak",
        quote:
          "Restrukturisasi mencakup ratusan anak/cucu BUMN, penyelesaian inter-company liabilities, dan fasilitas insentif pajak restrukturisasi.",
        analysis_note:
          "Memerlukan audit independen atas besaran insentif pajak yang dilepas negara serta kriteria penutupan anak usaha.",
      },
    ],
  },
  {
    id: "DOC-UU-16-2025",
    slug: "uu-nomor-16-tahun-2025-perubahan-keempat-uu-bumn-dan-bp-bumn",
    title:
      "Ringkasan Terkurasi UU Nomor 16 Tahun 2025 tentang Perubahan Keempat atas UU BUMN & Pembentukan BP BUMN",
    doc_number: "UU No. 16 Tahun 2025",
    issuer: "Dewan Perwakilan Rakyat RI & Presiden RI",
    published_date: "2025-10-06",
    period_year: 2025,
    doc_type: "REGULASI",
    original_source_url: "https://peraturan.bpk.go.id/",
    verification_status: "TERBUKTI",
    comparison_group: "REGULASI_BUMN_2025",
    summary:
      "Revisi keempat UU BUMN yang diundangkan pada 6 Oktober 2025, hanya tujuh bulan setelah UU No. 1/2025. Mengubah nomenklatur regulator menjadi Badan Pengaturan BUMN (BP BUMN) untuk memisahkan fungsi regulator dari operator (Danantara).",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — PEMISAHAN REGULATOR (BP BUMN) DAN OPERATOR (DANANTARA)",
        paragraphs: [
          "Undang-Undang Nomor 16 Tahun 2025 tentang Perubahan Keempat atas UU Nomor 19 Tahun 2003 tentang BUMN diundangkan pada 6 Oktober 2025.",
          "Substansi pokok undang-undang ini adalah memisahkan secara kelembagaan fungsi regulator dari fungsi operator dan pengelola investasi:",
          "- Badan Pengaturan BUMN (BP BUMN): Lembaga pemerintah yang menjalankan fungsi regulasi, pembinaan kebijakan, pengawasan makro, dan mewakili negara pada instrumen Saham Seri A Dwiwarna (1%).",
          "- BPI Danantara: Berkedudukan sebagai pengelola investasi dan operasional tunggal (superholding) atas portofolio dan dividen BUMN melalui Holding Operasional dan Holding Investasi.",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — DAMPAK TERHADAP UJI MATERI MK DAN KEPASTIAN HUKUM",
        paragraphs: [
          "Kecepatan revisi UU BUMN dua kali dalam rentang delapan bulan (Februari 2025 dan Oktober 2025) berdampak langsung pada gugatan konstitusional yang sedang berjalan di Mahkamah Konstitusi.",
          "Pada 30 Oktober 2025, Mahkamah Konstitusi memutus sejumlah perkara pengujian terhadap UU No. 1/2025 (Perkara No. 38, 43, 44, dan 80/PUU-XXIII/2025) tidak dapat diterima karena kehilangan objek pascaberlakunya UU No. 16/2025.",
          "Catatan Kritis: Perubahan cepat tanpa uji substansi konstitusional di MK meninggalkan pertanyaan publik mengenai batas nyata perlindungan Business Judgment Rule, definisi kerugian negara, dan mekanisme akuntabilitas eksternal terhadap keputusan investasi Danantara.",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Pembentukan BP BUMN",
        quote:
          "Fungsi regulator dialihkan ke Badan Pengaturan BUMN (BP BUMN) dengan kepemilikan 1% Saham Seri A Dwiwarna, sementara pengelolaan bisnis dan investasi berada di Danantara.",
        analysis_note:
          "Menjawab sebagian kritik rangkap peran regulator-operator, namun menyisakan uji efektivitas pengawasan di lapangan.",
      },
      {
        page: 2,
        section: "Dampak Legislasi Cepat terhadap Uji Materi MK",
        quote:
          "Revisi UU 16/2025 membuat sejumlah gugatan uji materi UU 1/2025 di Mahkamah Konstitusi dinyatakan kehilangan objek pada 30 Oktober 2025.",
        analysis_note:
          "Substansi norma pemisahan kerugian negara belum pernah diuji tuntas pokok perkaranya dalam putusan tersebut.",
      },
    ],
  },
  {
    id: "DOC-MK-2025-38",
    slug: "ringkasan-putusan-mk-perkara-38-43-44-80-puu-2025",
    title:
      "Catatan Sidang & Ringkasan Putusan Mahkamah Konstitusi atas Pengujian UU BUMN 2025 (Perkara 38, 43, 44, 80/PUU-XXIII/2025)",
    doc_number: "Putusan MK No. 38/PUU-XXIII/2025 dkk.",
    issuer: "Mahkamah Konstitusi Republik Indonesia",
    published_date: "2025-10-30",
    period_year: 2025,
    doc_type: "PUTUSAN_MK",
    original_source_url: "https://www.mkri.id/",
    verification_status: "TERBUKTI",
    comparison_group: "REGULASI_BUMN_2025",
    summary:
      "Dokumentasi pokok gugatan akademisi, praktisi hukum, dan mahasiswa terhadap Pasal 3H(2), 3X(1), 4B, 9G, dan 87(5) UU No. 1 Tahun 2025 serta amar putusan MK pada 30 Oktober 2025 yang menyatakan permohonan tidak dapat diterima karena kehilangan objek.",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — POKOK PERMOHONAN & PASAL YANG DIGUGAT",
        paragraphs: [
          "Sejumlah pemohon warga negara, akademisi, dan mahasiswa mendaftarkan uji materi terhadap UU Nomor 1 Tahun 2025 ke Mahkamah Konstitusi (tercatat dalam Perkara No. 38, 43, 44, dan 80/PUU-XXIII/2025).",
          "Pasal-pasal yang dimohonkan pengujian antara lain: Pasal 3H ayat (2), Pasal 3X ayat (1), Pasal 4B, Pasal 9G, dan Pasal 87 ayat (5) UU No. 1 Tahun 2025.",
          "Dalil Pemohon: Pemisahan kerugian Danantara/BUMN dari keuangan negara serta penghapusan status penyelenggara negara bagi organ Danantara dan Direksi/Komisaris BUMN dikhawatirkan melemahkan pemberantasan korupsi dan bertentangan dengan Pasal 33 UUD 1945.",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — AMAR PUTUSAN 30 OKTOBER 2025 (KEHILANGAN OBJEK)",
        paragraphs: [
          "Dalam sidang pengucapan putusan tanggal 30 Oktober 2025, Mahkamah Konstitusi menyatakan permohonan para pemohon pada Perkara No. 38, 43, 44, dan 80/PUU-XXIII/2025 tidak dapat diterima (niet ontvankelijke verklaard).",
          "Pertimbangan Hukum Utama: Norma undang-undang yang menjadi objek permohonan dalam UU No. 1 Tahun 2025 telah mengalami perubahan legislatif melalui pengundangan UU No. 16 Tahun 2025 pada 6 Oktober 2025, sehingga permohonan kehilangan objek.",
          "Arti Penting bagi Publik: Putusan tidak dapat diterima karena kehilangan objek berarti Mahkamah Konstitusi tidak mengesahkan maupun membatalkan pokok dalil pemohon. Publik tetap dapat mengajukan pengujian baru terhadap rumusan norma dalam UU No. 16 Tahun 2025.",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Daftar Pasal Objek Uji Materi",
        quote:
          "Pemohon menguji konstitusionalitas Pasal 3H ayat (2), Pasal 3X ayat (1), Pasal 4B, Pasal 9G, dan Pasal 87 ayat (5) UU No. 1 Tahun 2025.",
        analysis_note:
          "Menunjukkan kekhawatiran terstruktur dari komunitas hukum atas potensi celah akuntabilitas.",
      },
      {
        page: 2,
        section: "Amar Putusan 30 Oktober 2025",
        quote:
          "Permohonan dinyatakan tidak dapat diterima karena objek pengujian telah diubah oleh UU Nomor 16 Tahun 2025.",
        analysis_note:
          "Bukan putusan pengesahan substansi norma, melainkan putusan prosedural akibat perubahan undang-undang.",
      },
    ],
  },
  {
    id: "DOC-AUDIT-2026-Q4",
    slug: "catatan-pemantauan-laporan-keuangan-perdana-danantara-2026",
    title:
      "Dossier Pemantauan: Daftar Periksa Keterbukaan Laporan Keuangan Konsolidasian Perdana Danantara (2025-2026)",
    doc_number: "BD-AUDIT-CHK-2026",
    issuer: "Tim Riset & Akuntansi Forensik Bongkar Danantara",
    published_date: "2026-11-18",
    period_year: 2026,
    doc_type: "ANALISIS_DATA",
    original_source_url: "https://www.bpk.go.id/",
    verification_status: "BELUM TERVERIFIKASI",
    comparison_group: "NERACA_7_BUMN",
    summary:
      "Instrumen pemeriksaan publik atas rencana rilis laporan keuangan konsolidasian perdana Danantara periode 9 bulan operasional 2025 pasca-audit BPK pada November 2026. Memuat 8 indikator keterbukaan wajib yang belum sepenuhnya terbuka kepada masyarakat.",
    pages: [
      {
        page: 1,
        heading: "HALAMAN 1 — KONTEKS RILIS LAPORAN KEUANGAN PERDANA (NOVEMBER 2026)",
        paragraphs: [
          "Menjelang akhir November 2026, Danantara menjadwalkan pemaparan laporan keuangan konsolidasian perdananya setelah merampungkan proses audit bersama Badan Pemeriksa Keuangan (BPK), mencakup sekitar 9 bulan pertama operasional tahun 2025.",
          "Sebagai pengelola aset strategis publik, publikasi sekadar angka ringkasan (headline profit/asset) tidak cukup memenuhi standar transparansi internasional seperti Santiago Principles untuk Sovereign Wealth Fund.",
          "Daftar Periksa 8 Indikator Keterbukaan Minimum Bongkar Danantara:",
          "1. Rincian penuh daftar proyek investasi yang dibiayai dana efisiensi APBN Rp300 triliun (US$20 miliar) beserta nilai komitmen per proyek.",
          "2. Identitas pemilik manfaat akhir (beneficial owner) seluruh mitra swasta domestik maupun asing dalam skema co-investment.",
          "3. Tabel rekonsiliasi antara klaim AUM US$900 miliar dengan ekuitas bersih konsolidasi (tidak mencampuradukkan Dana Pihak Ketiga bank Himbara).",
          "4. Aliran penuh dividen BUMN tahun 2025-2026: berapa yang ditahan Danantara, berapa yang disetor ke kas negara, dan berapa yang dipakai untuk penyertaan modal proyek baru.",
        ],
      },
      {
        page: 2,
        heading: "HALAMAN 2 — INDIKATOR TATA KELOLA, REMUNERASI, DAN AUDIT LENGKAP",
        paragraphs: [
          "Lanjutan Daftar Periksa Keterbukaan Minimum:",
          "5. Opini audit BPK secara utuh termasuk paragraf penekanan suatu hal (emphasis of matter) dan catatan temuan sistem pengendalian intern.",
          "6. Rincian biaya operasional badan, total remunerasi/tantiem Badan Pelaksana, Dewan Pengawas, serta kontrak dan biaya Dewan Penasihat Global.",
          "7. Daftar entitas anak dan cucu BUMN yang ditutup, dimerger, atau dilepas, berikut valuasi aset dan kewajiban pesangon/utang yang diselesaikan.",
          "8. Pengungkapan transaksi pihak berelasi (related-party transactions) sesuai PSAK untuk memverifikasi ketiadaan benturan kepentingan pejabat pengelola.",
        ],
      },
    ],
    key_citations: [
      {
        page: 1,
        section: "Standar Pengungkapan Laporan Keuangan Perdana",
        quote:
          "Publikasi angka ringkasan tidak cukup memenuhi Santiago Principles; publik membutuhkan rekonsiliasi ekuitas bersih, daftar proyek dana Rp300 T, dan pemilik manfaat mitra swasta.",
        analysis_note:
          "Menjadi tolok ukur objektif saat dokumen laporan keuangan auditan BPK dirilis penuh ke publik.",
      },
      {
        page: 2,
        section: "Transparansi Transaksi Pihak Berelasi & Remunerasi",
        quote:
          "Catatan atas laporan keuangan wajib memuat pengungkapan transaksi pihak berelasi sesuai PSAK serta total biaya operasional dan remunerasi pengurus.",
        analysis_note:
          "Kunci untuk memverifikasi secara berbasis bukti ada atau tidaknya konflik kepentingan.",
      },
    ],
  },
];

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateAllPdfs(): Promise<
  Record<string, { file_path: string; file_size_kb: number; sha256_hash: string; page_count: number }>
> {
  const outDir = path.join(process.cwd(), "public", "documents");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const manifest: Record<
    string,
    { file_path: string; file_size_kb: number; sha256_hash: string; page_count: number }
  > = {};

  for (const spec of PDF_SPECS) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(spec.title);
    pdfDoc.setAuthor("Arsip Dokumen Terbuka - Bongkar Danantara");
    pdfDoc.setSubject(spec.doc_number);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    for (const pageSpec of spec.pages) {
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();

      // Top dark masthead strip
      page.drawRectangle({
        x: 0,
        y: height - 66,
        width,
        height: 66,
        color: rgb(0.08, 0.08, 0.08),
      });
      page.drawRectangle({
        x: 0,
        y: height - 70,
        width,
        height: 4,
        color: rgb(0.62, 0.11, 0.11),
      });

      page.drawText("BONGKAR DANANTARA // ARSIP DOKUMEN TERBUKA", {
        x: 42,
        y: height - 28,
        size: 10,
        font: fontBold,
        color: rgb(0.97, 0.96, 0.94),
      });
      page.drawText(
        `ID ARSIP: ${spec.id}  |  NOMOR: ${spec.doc_number}  |  STATUS: ${spec.verification_status}`,
        {
          x: 42,
          y: height - 48,
          size: 8.5,
          font: fontMono,
          color: rgb(0.82, 0.8, 0.76),
        }
      );

      let cursorY = height - 102;

      if (pageSpec.page === 1) {
        const titleLines = wrapText(spec.title, 62);
        for (const line of titleLines) {
          page.drawText(line, {
            x: 42,
            y: cursorY,
            size: 14,
            font: fontBold,
            color: rgb(0.06, 0.06, 0.06),
          });
          cursorY -= 19;
        }
        cursorY -= 4;
        page.drawText(
          `Penerbit/Sumber: ${spec.issuer}  |  Tanggal: ${spec.published_date}`,
          {
            x: 42,
            y: cursorY,
            size: 8.5,
            font: fontMono,
            color: rgb(0.32, 0.31, 0.29),
          }
        );
        cursorY -= 14;
        page.drawLine({
          start: { x: 42, y: cursorY },
          end: { x: width - 42, y: cursorY },
          thickness: 1.2,
          color: rgb(0.1, 0.1, 0.1),
        });
        cursorY -= 22;
      }

      // Section Heading
      page.drawRectangle({
        x: 42,
        y: cursorY - 6,
        width: width - 84,
        height: 22,
        color: rgb(0.94, 0.93, 0.9),
      });
      page.drawText(pageSpec.heading, {
        x: 50,
        y: cursorY,
        size: 9.5,
        font: fontBold,
        color: rgb(0.62, 0.11, 0.11),
      });
      cursorY -= 28;

      for (const paragraph of pageSpec.paragraphs) {
        const lines = wrapText(paragraph, 84);
        for (const line of lines) {
          if (cursorY < 84) break;
          page.drawText(line, {
            x: 42,
            y: cursorY,
            size: 10,
            font: fontRegular,
            color: rgb(0.12, 0.12, 0.12),
          });
          cursorY -= 15;
        }
        cursorY -= 8;
      }

      // Footer
      page.drawLine({
        start: { x: 42, y: 56 },
        end: { x: width - 42, y: 56 },
        thickness: 0.7,
        color: rgb(0.65, 0.63, 0.59),
      });
      page.drawText(
        `Dokumen ringkasan terkurasi untuk riset publik. Sumber primer: ${spec.original_source_url}`,
        {
          x: 42,
          y: 40,
          size: 8,
          font: fontMono,
          color: rgb(0.35, 0.34, 0.32),
        }
      );
      page.drawText(`Halaman ${pageSpec.page} dari ${spec.pages.length}`, {
        x: width - 120,
        y: 40,
        size: 8.5,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    const filename = `${spec.id}.pdf`;
    const fullPath = path.join(outDir, filename);
    fs.writeFileSync(fullPath, buffer);

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    manifest[spec.id] = {
      file_path: `/documents/${filename}`,
      file_size_kb: Math.max(1, Math.round(buffer.length / 1024)),
      sha256_hash: sha256,
      page_count: spec.pages.length,
    };
  }

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  return manifest;
}

if (require.main === module) {
  generateAllPdfs()
    .then((m) => {
      console.log(
        `Generated ${Object.keys(m).length} archival PDF documents in public/documents/`
      );
    })
    .catch((err) => {
      console.error("Failed generating PDFs:", err);
      process.exit(1);
    });
}
