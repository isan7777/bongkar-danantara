# BONGKAR DANANTARA

> **Uang Rakyat, Kekuasaan Besar, Transparansi Harus Dibuka.**

Platform investigasi, dokumentasi, dan pengawasan publik independen yang dibangun untuk memeriksa, mendokumentasikan, dan mempublikasikan informasi terverifikasi terkait pengelolaan investasi serta aset negara oleh Badan Pengelola Investasi Daya Anagata Nusantara (Danantara Indonesia).

## Prinsip Inti

- Tidak ada kekuasaan yang boleh kebal dari pertanyaan.
- Tidak ada uang publik yang boleh luput dari pengawasan.
- Tidak ada tuduhan yang boleh lolos dari pembuktian.

Setiap publikasi memisahkan secara tegas antara **TERBUKTI**, **TERDOKUMENTASI**, **DUGAAN**, **BELUM TERVERIFIKASI**, dan **BANTAHAN**.

## Fitur Utama

1. **Homepage Editorial Broadsheet (`/`)**: Headline investigasi utama, status pembuktian artikel, ringkasan data & fakta Danantara, grafik keuangan interaktif, arsip dokumen PDF, daftar pertanyaan belum dijawab, timeline keputusan penting, dan kanal hak jawab.
2. **Enam Kategori Investigasi (`/investigasi`, `/kategori/[slug]`, `/investigasi/[slug]`)**:
   - A. Jejak Uang
   - B. Siapa di Balik Kekuasaan?
   - C. Dokumen Terbuka
   - D. Konflik Kepentingan
   - E. Kebijakan Bermasalah
   - F. Investigasi Mendalam
   - Setiap artikel dilengkapi bagian wajib **BUKTI DAN SUMBER**, metodologi verifikasi, hak jawab pihak terkait, dan log catatan koreksi.
3. **Database Investigasi Entitas (`/database`, `/database/[slug]`)**: Pencarian dan penyaringan berdasarkan nama individu/perusahaan, jenis entitas, jabatan, sektor industri, nilai aset/transaksi, tahun, dan dokumen sumber. Setiap profil dilengkapi peta relasi terdokumentasi, riwayat jabatan, kronologi, dan tautan sumber.
4. **Vault Dokumen & Pembaca PDF (`/dokumen`, `/dokumen/[id]`, `/dokumen/bandingkan`)**: Pembaca PDF tersemat, pencari teks transkrip per halaman, pemeriksa kutipan & nomor halaman, integritas SHA-256, unduhan PDF, serta alat pembanding laporan keuangan (2023 vs 2024) dan revisi regulasi (UU No. 1/2025 vs UU No. 16/2025).
5. **Visualisasi Data Keuangan (`/keuangan`)**: Grafik interaktif (Recharts) membandingkan total aset, laba bersih, dividen 7 BUMN inti, klaim AUM vs neraca riil, serta ekspor dataset CSV (`/api/financials?format=csv`).
6. **Timeline Keputusan Penting (`/timeline`)**: Kronologi regulasi, kelembagaan, uji materi Mahkamah Konstitusi, dan agenda audit yang dapat disaring berdasarkan tahun, kategori, dan status pembuktian.
7. **Kirim Laporan Publik & Pelacakan Anonim (`/lapor`, `/lapor/cek`)**: Pengiriman laporan anonim/samaran/rahasia dengan unggahan dokumen pendukung yang disimpan di luar direktori publik (`data/uploads/`), dilengkapi peringatan keamanan operasional yang jujur serta kode pelacakan + PIN ter-hash untuk memantau moderasi redaksi.
8. **Hak Jawab, Bantahan & Koreksi (`/hak-jawab`)**: Ruang khusus tanggapan resmi Danantara dan pihak terkait, log koreksi redaksi, serta formulir pengajuan hak jawab resmi.
9. **Pencarian Global (`/cari` & modal `Ctrl+K`)**: Pencarian instan lintas artikel, entitas, dokumen PDF, timeline, pertanyaan terbuka, dan hak jawab.
10. **Dashboard Admin Redaksi (`/admin`)**: Autentikasi sesi HMAC-SHA256 `HttpOnly` untuk menerbitkan/mengedit artikel, mencatat koreksi, memoderasi laporan pelapor dan mengunduh bukti secara aman, mengunggah PDF baru, menambah entitas, serta mengelola hak jawab dan pertanyaan terbuka.

## Arsitektur Teknis

- **Framework**: Next.js 15 (App Router, TypeScript strict) + Tailwind CSS v4
- **Database**: SQLite tersemat melalui `node:sqlite` (Node.js 24, WAL mode, 15 tabel ternormalisasi)
- **Visualisasi**: Recharts + pelat infografis SVG editorial
- **Pembuat PDF Arsip**: `pdf-lib` (`scripts/generate-pdfs.ts`)
- **Keamanan**: Validasi skema `zod`, kueri SQL terparameterisasi, hash kata sandi & PIN dengan `crypto.scryptSync`, cookie sesi `HttpOnly` + `SameSite=Lax` bertanda tangan HMAC-SHA256, pemeriksaan magic bytes unggahan file, penyimpanan bukti terisolasi di `data/uploads/`, rate limiting API, dan header keamanan HTTP.

## Tautan Publik & Deployment

- **Repositori GitHub**: `https://github.com/isan7777/bongkar-danantara`
- **Web Live (GitHub Pages)**: `https://isan7777.github.io/bongkar-danantara/`

> Catatan Mode Deployment: Versi GitHub Pages menyajikan seluruh halaman investigasi, 8 arsip PDF, database entitas, diagram relasi, grafik keuangan, unduhan CSV, dan pencarian global secara statis. Untuk mengaktifkan backend penuh SQLite (`POST /api/*`, penyimpanan bukti whistleblower terisolasi di `data/uploads/`, dan CRUD Dashboard Admin), jalankan server Node.js secara lokal atau di VPS.

## Cara Menjalankan Secara Lokal

Prasyarat: **Node.js 22.5+ atau Node.js 24+** (mendukung `node:sqlite`).

```bash
# 1. Pasang dependensi
npm install

# 2. Hasilkan arsip PDF & isi database SQLite dengan data publik terverifikasi
npm run setup

# 3. Jalankan server pengembangan (port 3055)
npm run dev
```

Buka `http://localhost:3055` di peramban.

### Perintah Produksi & Pengujian

```bash
npm run typecheck   # Pemeriksaan tipe TypeScript
npm test            # Menjalankan suite uji otomatis (DB, keamanan, PDF, pencarian)
npm run build       # Build produksi Next.js
npm run start       # Menjalankan server produksi di port 3055
```

### Konfigurasi Variabel Lingkungan (Server Node.js)

Untuk mengaktifkan akun admin meja redaksi dan sesi terenkripsi pada deployment server Node.js, buat berkas `.env.local` (diabaikan oleh Git) sebelum menjalankan `npm run seed`:

```env
BONGKAR_ADMIN_USERNAME=<username-admin-anda>
BONGKAR_ADMIN_PASSWORD=<kata-sandi-kuat-minimal-12-karakter>
BONGKAR_SESSION_SECRET=<kunci-acak-minimal-32-byte>
```

Jangan pernah menyimpan kata sandi admin atau `BONGKAR_SESSION_SECRET` di dalam repositori publik.

