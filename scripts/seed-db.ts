import fs from "node:fs";
import path from "node:path";
import { getDb, closeDb, getUploadsDir } from "../src/lib/db/client";
import { hashSecret } from "../src/lib/auth";
import { PDF_SPECS, generateAllPdfs } from "./generate-pdfs";

async function seed(): Promise<void> {
  const manifestPath = path.join(process.cwd(), "public", "documents", "manifest.json");
  let manifest: Record<
    string,
    { file_path: string; file_size_kb: number; sha256_hash: string; page_count: number }
  >;

  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } else {
    manifest = await generateAllPdfs();
  }

  getUploadsDir();
  const db = getDb();

  db.exec("BEGIN TRANSACTION");
  try {
    // 1. Admin users (only provisioned when explicit env credentials are configured)
    const adminUsername = process.env.BONGKAR_ADMIN_USERNAME?.trim();
    const adminPassword = process.env.BONGKAR_ADMIN_PASSWORD;
    if (adminUsername && adminPassword && adminPassword.length >= 8) {
      const adminHash = hashSecret(adminPassword);
      db.prepare(
        `INSERT OR REPLACE INTO admin_users (id, username, display_name, role, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        "ADM-01",
        adminUsername,
        "Dewan Redaksi Investigasi",
        "EDITOR_IN_CHIEF",
        adminHash,
        "2025-02-25T00:00:00Z"
      );
    }

    // 2. Six Investigative Categories (Section 4)
    const categories = [
      {
        id: "CAT-A",
        slug: "jejak-uang",
        code: "A",
        name: "Jejak Uang",
        description:
          "Menelusuri aliran investasi, konsolidasi dividen BUMN, nilai aset riil, pendanaan efisiensi APBN, dan keputusan finansial strategis.",
        sort_order: 1,
      },
      {
        id: "CAT-B",
        slug: "siapa-di-balik-kekuasaan",
        code: "B",
        name: "Siapa di Balik Kekuasaan?",
        description:
          "Pemetaan pejabat, direksi, dewan pengawas, penasihat global, serta jaringan profesional dan bisnis yang terdokumentasi.",
        sort_order: 2,
      },
      {
        id: "CAT-C",
        slug: "dokumen-terbuka",
        code: "C",
        name: "Dokumen Terbuka",
        description:
          "Publikasi regulasi, Keputusan Presiden, ringkasan laporan keuangan, putusan Mahkamah Konstitusi, dan arsip sumber publik.",
        sort_order: 3,
      },
      {
        id: "CAT-D",
        slug: "konflik-kepentingan",
        code: "D",
        name: "Konflik Kepentingan",
        description:
          "Investigasi rangkap jabatan, irisan kewenangan regulator-operator, afiliasi korporasi, dan potensi benturan kepentingan publik.",
        sort_order: 4,
      },
      {
        id: "CAT-E",
        slug: "kebijakan-bermasalah",
        code: "E",
        name: "Kebijakan Bermasalah",
        description:
          "Bedah pasal undang-undang, aturan pemisahan kerugian negara, risiko fiskal, dan kebijakan tata kelola yang minim transparansi.",
        sort_order: 5,
      },
      {
        id: "CAT-F",
        slug: "investigasi-mendalam",
        code: "F",
        name: "Investigasi Mendalam",
        description:
          "Laporan panjang berbasis dokumen primer, analisis forensik neraca, wawancara ahli, dan verifikasi independen.",
        sort_order: 6,
      },
    ];

    const insertCat = db.prepare(
      `INSERT OR REPLACE INTO categories (id, slug, code, name, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const c of categories) {
      insertCat.run(c.id, c.slug, c.code, c.name, c.description, c.sort_order);
    }

    // 3. Documents (synced with generated real PDFs)
    const insertDoc = db.prepare(
      `INSERT OR REPLACE INTO documents (
        id, slug, title, doc_type, issuer, doc_number, published_date, period_year,
        page_count, file_path, file_size_kb, sha256_hash, original_source_url,
        verification_status, summary, key_citations_json, pages_text_json,
        comparison_group, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const spec of PDF_SPECS) {
      const m = manifest[spec.id];
      const pagesText = spec.pages.map((p) => ({
        page: p.page,
        heading: p.heading,
        content: p.paragraphs.join("\n\n"),
      }));
      insertDoc.run(
        spec.id,
        spec.slug,
        spec.title,
        spec.doc_type,
        spec.issuer,
        spec.doc_number,
        spec.published_date,
        spec.period_year,
        m?.page_count ?? spec.pages.length,
        m?.file_path ?? `/documents/${spec.id}.pdf`,
        m?.file_size_kb ?? 12,
        m?.sha256_hash ?? "pending",
        spec.original_source_url,
        spec.verification_status,
        spec.summary,
        JSON.stringify(spec.key_citations),
        JSON.stringify(pagesText),
        spec.comparison_group,
        `${spec.published_date}T08:00:00Z`
      );
    }

    // 4. Entities (16 verified real public entities: Institutions, Individuals, Companies, Projects)
    const entities = [
      {
        id: "ENT-DANANTARA",
        slug: "bpi-danantara-indonesia",
        name: "BPI Danantara Indonesia",
        entity_type: "LEMBAGA",
        current_role: "Badan Pengelola Investasi Negara (Superholding BUMN)",
        organization: "Republik Indonesia (Bertanggung Jawab Langsung ke Presiden)",
        sector: "Tata Kelola & Investasi Negara",
        transaction_value_idr_t: 9353.4,
        year_active: 2025,
        verification_status: "TERBUKTI",
        summary:
          "Badan hukum khusus (sui generis) yang dibentuk berdasarkan UU No. 1 Tahun 2025 dan diluncurkan 24 Februari 2025 untuk mengonsolidasikan aset BUMN, mengelola dividen, dan mendanai proyek investasi strategis nasional.",
        positions_history: [
          {
            period: "24 Feb 2025 - Sekarang",
            role: "Badan Pengelola Investasi Negara (UU No. 1/2025 & PP No. 10/2025)",
            institution: "Republik Indonesia",
            source_ref: "DOC-UU-01-2025, hlm. 1",
            status: "TERBUKTI",
          },
          {
            period: "6 Okt 2025 - Sekarang",
            role: "Operator & Pengelola Investasi Tunggal terpisah dari BP BUMN (UU No. 16/2025)",
            institution: "Republik Indonesia",
            source_ref: "DOC-UU-16-2025, hlm. 1",
            status: "TERBUKTI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Peluncuran Resmi di Istana Kepresidenan",
            description:
              "Presiden Prabowo Subianto meresmikan BPI Danantara bersamaan dengan pengundangan UU No. 1/2025, PP No. 10/2025, dan Keppres No. 30/2025.",
            doc_id: "DOC-UU-01-2025",
            status: "TERBUKTI",
          },
          {
            date: "2025-03-21",
            title: "Penunjukan PT BKI sebagai Holding Operasional",
            description:
              "Pemerintah menerbitkan PP No. 15/2025 untuk mekanisme inbreng saham Seri B dan C BUMN ke PT Biro Klasifikasi Indonesia.",
            doc_id: "DOC-PP-15-2025",
            status: "TERBUKTI",
          },
          {
            date: "2025-03-24",
            title: "Pengumuman Struktur Pengurus Lengkap & Penasihat Global",
            description:
              "Mengumumkan Dewan Pengarah (SBY, Jokowi), 5 Dewan Penasihat Global, jajaran Managing Director, serta Komite Pengawasan.",
            doc_id: "DOC-KEPPRES-30-2025",
            status: "TERDOKUMENTASI",
          },
          {
            date: "2026-11-18",
            title: "Agenda Pemaparan Laporan Keuangan Konsolidasian Perdana",
            description:
              "Dijadwalkan mempublikasikan laporan keuangan periode 9 bulan pertama 2025 pasca-audit BPK.",
            doc_id: "DOC-AUDIT-2026-Q4",
            status: "BELUM TERVERIFIKASI",
          },
        ],
        key_metrics: [
          {
            label: "Klaim AUM Publik",
            value: "~US$900 Miliar",
            note: "Belum dilengkapi rincian tabel valuasi per aset publik",
          },
          {
            label: "Aset Bruto 7 BUMN Awal (FY 2024)",
            value: "Rp9.353,40 Triliun",
            note: "59,3% berada di 3 bank Himbara (mayoritas dana nasabah)",
          },
          {
            label: "Modal Awal Minimum UU",
            value: "Rp1.000 Triliun",
            note: "UU No. 1 Tahun 2025",
          },
        ],
      },
      {
        id: "ENT-ROSAN",
        slug: "rosan-perkasa-roeslani",
        name: "Rosan Perkasa Roeslani",
        entity_type: "INDIVIDU",
        current_role: "Group Chief Executive Officer (CEO) BPI Danantara",
        organization: "BPI Danantara / Kementerian Investasi dan Hilirisasi",
        sector: "Tata Kelola & Investasi Negara",
        transaction_value_idr_t: 1000,
        year_active: 2025,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Menjabat sebagai Kepala Badan Pelaksana (Group CEO) BPI Danantara berdasarkan Keppres No. 30 Tahun 2025 sambil juga menjabat sebagai Menteri Investasi dan Hilirisasi / Kepala BKPM. Posisi ganda ini menjadi fokus utama diskursus tata kelola dan potensi benturan kepentingan.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "Group Chief Executive Officer (CEO)",
            institution: "BPI Danantara Indonesia",
            source_ref: "DOC-KEPPRES-30-2025, hlm. 1",
            status: "TERBUKTI",
          },
          {
            period: "Okt 2024 - Sekarang",
            role: "Menteri Investasi dan Hilirisasi / Kepala BKPM",
            institution: "Kabinet Merah Putih",
            source_ref: "Pengumuman Resmi Sekretariat Negara",
            status: "TERBUKTI",
          },
          {
            period: "2023 - 2024",
            role: "Wakil Menteri BUMN / Wakil Komisaris Utama PT Pertamina (Persero)",
            institution: "Kementerian BUMN",
            source_ref: "Arsip Publik Kementerian BUMN",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Diangkat sebagai Group CEO Danantara via Keppres 30/2025",
            description:
              "Penunjukan dilakukan bersamaan dengan status aktifnya sebagai Menteri Investasi dan Hilirisasi.",
            doc_id: "DOC-KEPPRES-30-2025",
            status: "TERBUKTI",
          },
          {
            date: "2025-02-26",
            title: "Pernyataan Publik Bantahan Isu Kebal Hukum",
            description:
              "Menegaskan secara terbuka bahwa Danantara tidak kebal hukum dan tetap dapat diaudit BPK serta ditindak KPK jika terjadi penyimpangan.",
            doc_id: "DOC-AUDIT-2026-Q4",
            status: "BANTAHAN",
          },
        ],
        key_metrics: [
          {
            label: "Status Rangkap Jabatan (Saat Dilantik)",
            value: "Tercatat (2 Jabatan)",
            note: "Menteri Investasi & Group CEO Danantara",
          },
          {
            label: "Kewenangan Operasional",
            value: "Pimpinan Badan Pelaksana",
            note: "Bertanggung jawab langsung kepada Presiden",
          },
        ],
      },
      {
        id: "ENT-DONY",
        slug: "dony-oskaria",
        name: "Dony Oskaria",
        entity_type: "INDIVIDU",
        current_role: "Chief Operating Officer (COO) BPI Danantara / Holding Operasional",
        organization: "BPI Danantara / Kementerian BUMN",
        sector: "Holding Operasional",
        transaction_value_idr_t: 9353.4,
        year_active: 2025,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Memimpin pilar Holding Operasional (Danantara Asset Management) yang membawahi konsolidasi ratusan entitas BUMN melalui PT BKI, sembari menjabat sebagai Wakil Menteri BUMN pada saat pengangkatan.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "Chief Operating Officer (COO) — Holding Operasional",
            institution: "BPI Danantara Indonesia",
            source_ref: "DOC-KEPPRES-30-2025, hlm. 1",
            status: "TERBUKTI",
          },
          {
            period: "Okt 2024 - 2025",
            role: "Wakil Menteri BUMN",
            institution: "Kementerian BUMN",
            source_ref: "Sekretariat Negara RI",
            status: "TERBUKTI",
          },
          {
            period: "2021 - 2024",
            role: "Direktur Utama",
            institution: "PT Aviasi Pariwisata Indonesia (Persero) / InJourney",
            source_ref: "Laporan Tahunan InJourney",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Penunjukan sebagai COO BPI Danantara",
            description:
              "Ditugaskan mengawasi restrukturisasi operasional dan perampingan entitas anak/cucu BUMN.",
            doc_id: "DOC-KEPPRES-30-2025",
            status: "TERBUKTI",
          },
        ],
        key_metrics: [
          {
            label: "Fokus Mandat",
            value: "Holding Operasional (DAM)",
            note: "Konsolidasi & efisiensi 800+ entitas BUMN",
          },
        ],
      },
      {
        id: "ENT-PANDU",
        slug: "pandu-patria-sjahrir",
        name: "Pandu Patria Sjahrir",
        entity_type: "INDIVIDU",
        current_role: "Chief Investment Officer (CIO) BPI Danantara / Holding Investasi",
        organization: "BPI Danantara Indonesia",
        sector: "Investasi & Pasar Modal",
        transaction_value_idr_t: 300,
        year_active: 2025,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Memimpin pilar Holding Investasi (Danantara Investment Management) yang bertanggung jawab mengarahkan penempatan modal investasi, kerja sama global, dan alokasi dividen konsolidasi BUMN.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "Chief Investment Officer (CIO) — Holding Investasi",
            institution: "BPI Danantara Indonesia",
            source_ref: "DOC-KEPPRES-30-2025, hlm. 1",
            status: "TERBUKTI",
          },
          {
            period: "Sebelumnya",
            role: "Eksekutif & Investor Sektor Energi, Teknologi, dan Pasar Modal",
            institution: "Sektor Swasta & Bursa Efek Indonesia (mantan Komisaris BEI)",
            source_ref: "Catatan Publik Keterbukaan BEI",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Penunjukan sebagai CIO BPI Danantara",
            description:
              "Mengelola portofolio investasi strategis dan negosiasi mitra investasi internasional. Catatan metodologi: Latar belakang bisnis sektor swasta menuntut pengungkapan penuh deklarasi benturan kepentingan pada setiap transaksi investasi.",
            doc_id: "DOC-KEPPRES-30-2025",
            status: "TERDOKUMENTASI",
          },
        ],
        key_metrics: [
          {
            label: "Fokus Mandat",
            value: "Holding Investasi (DIM)",
            note: "Penempatan dividen & dana proyek strategis",
          },
        ],
      },
      {
        id: "ENT-ERICK",
        slug: "erick-thohir",
        name: "Erick Thohir",
        entity_type: "INDIVIDU",
        current_role: "Ketua Dewan Pengawas BPI Danantara",
        organization: "Dewan Pengawas BPI Danantara / Pemerintah RI",
        sector: "Tata Kelola & Regulasi",
        transaction_value_idr_t: null,
        year_active: 2025,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Ditunjuk sebagai Ketua Dewan Pengawas BPI Danantara pada peluncuran Februari 2025 dalam kapasitasnya sebagai Menteri BUMN, sebelum UU No. 16 Tahun 2025 mengubah arsitektur kelembagaan kementerian menjadi Badan Pengaturan BUMN (BP BUMN).",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "Ketua Dewan Pengawas",
            institution: "BPI Danantara Indonesia",
            source_ref: "DOC-KEPPRES-30-2025, hlm. 1",
            status: "TERBUKTI",
          },
          {
            period: "2019 - 2025",
            role: "Menteri Badan Usaha Milik Negara",
            institution: "Kementerian BUMN RI",
            source_ref: "Sekretariat Negara RI",
            status: "TERBUKTI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Penunjukan sebagai Ketua Dewan Pengawas Danantara",
            description:
              "Memimpin fungsi pengawasan tata kelola bersama Muliaman D. Hadad dan Sri Mulyani Indrawati.",
            doc_id: "DOC-KEPPRES-30-2025",
            status: "TERBUKTI",
          },
        ],
        key_metrics: [
          {
            label: "Peran Struktural",
            value: "Ketua Dewan Pengawas",
            note: "Pengawas Rencana Kerja & Anggaran Danantara",
          },
        ],
      },
      {
        id: "ENT-MULIAMAN",
        slug: "muliaman-d-hadad",
        name: "Muliaman D. Hadad",
        entity_type: "INDIVIDU",
        current_role: "Wakil Ketua Dewan Pengawas BPI Danantara",
        organization: "Dewan Pengawas BPI Danantara",
        sector: "Tata Kelola & Regulasi",
        transaction_value_idr_t: null,
        year_active: 2025,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Mantan Ketua Dewan Komisioner OJK yang sempat ditunjuk memimpin persiapan awal Danantara pada akhir 2024, kemudian ditetapkan sebagai Wakil Ketua Dewan Pengawas pada Februari 2025.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "Wakil Ketua Dewan Pengawas",
            institution: "BPI Danantara Indonesia",
            source_ref: "DOC-KEPPRES-30-2025, hlm. 1",
            status: "TERBUKTI",
          },
          {
            period: "2012 - 2017",
            role: "Ketua Dewan Komisioner",
            institution: "Otoritas Jasa Keuangan (OJK)",
            source_ref: "Arsip OJK",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Ditetapkan sebagai Wakil Ketua Dewan Pengawas",
            description:
              "Mendampingi Ketua Dewan Pengawas dalam pengawasan tata kelola lembaga.",
            doc_id: "DOC-KEPPRES-30-2025",
            status: "TERBUKTI",
          },
        ],
        key_metrics: [],
      },
      {
        id: "ENT-ADVISORS",
        slug: "dewan-penasihat-global-danantara",
        name: "Dewan Penasihat Global Danantara",
        entity_type: "LEMBAGA",
        current_role: "Panel Penasihat Strategis Makroekonomi & Investasi Global",
        organization: "Ray Dalio, Jeffrey Sachs, Helman Sitohang, F. Chapman Taylor, Thaksin Shinawatra",
        sector: "Investasi Global",
        transaction_value_idr_t: null,
        year_active: 2025,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Panel beranggotakan lima tokoh ekonomi dan politik global yang diumumkan pada 24 Maret 2025 untuk memberi masukan risiko makroekonomi dan kredibilitas pasar internasional. Rincian kontrak kerja, mandat akses data internal, dan besaran remunerasi belum diumumkan terbuka.",
        positions_history: [
          {
            period: "24 Mar 2025 - Sekarang",
            role: "Board of Advisors (5 Anggota)",
            institution: "BPI Danantara Indonesia",
            source_ref: "DOC-KEPPRES-30-2025, hlm. 2",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-03-24",
            title: "Pengumuman Lima Anggota Dewan Penasihat Global",
            description:
              "Nama Ray Dalio, Jeffrey Sachs, Helman Sitohang, F. Chapman Taylor, dan Thaksin Shinawatra diumumkan resmi oleh manajemen Danantara.",
            doc_id: "DOC-KEPPRES-30-2025",
            status: "TERDOKUMENTASI",
          },
        ],
        key_metrics: [
          {
            label: "Jumlah Anggota",
            value: "5 Tokoh Global",
            note: "4 internasional + 1 Indonesia (Helman Sitohang)",
          },
          {
            label: "Keterbukaan Remunerasi",
            value: "Belum Dipublikasikan",
            note: "Masuk daftar pertanyaan terbuka Q-05",
          },
        ],
      },
      {
        id: "ENT-BP-BUMN",
        slug: "badan-pengaturan-bumn-bp-bumn",
        name: "Badan Pengaturan BUMN (BP BUMN)",
        entity_type: "LEMBAGA",
        current_role: "Regulator Kebijakan BUMN & Pemegang Kuasa Saham Seri A Dwiwarna",
        organization: "Pemerintah Republik Indonesia",
        sector: "Tata Kelola & Regulasi",
        transaction_value_idr_t: null,
        year_active: 2025,
        verification_status: "TERBUKTI",
        summary:
          "Lembaga regulator baru yang dibentuk berdasarkan UU No. 16 Tahun 2025 (6 Oktober 2025) untuk memisahkan fungsi pengaturan dan pengawasan negara dari fungsi operasional/investasi yang dijalankan BPI Danantara.",
        positions_history: [
          {
            period: "6 Okt 2025 - Sekarang",
            role: "Regulator BUMN & Pemegang Representasi 1% Saham Seri A Dwiwarna",
            institution: "Pemerintah RI (UU No. 16/2025)",
            source_ref: "DOC-UU-16-2025, hlm. 1",
            status: "TERBUKTI",
          },
        ],
        chronology: [
          {
            date: "2025-10-06",
            title: "Pembentukan Resmi melalui UU No. 16 Tahun 2025",
            description:
              "Mengubah tata kelola BUMN dengan memisahkan regulator (BP BUMN) dari operator superholding (Danantara).",
            doc_id: "DOC-UU-16-2025",
            status: "TERBUKTI",
          },
        ],
        key_metrics: [
          {
            label: "Hak Kontrol Negara",
            value: "1% Saham Seri A Dwiwarna",
            note: "Residual control rights strategis",
          },
        ],
      },
      {
        id: "ENT-BKI",
        slug: "pt-biro-klasifikasi-indonesia-bki",
        name: "PT Biro Klasifikasi Indonesia (Persero) / BKI",
        entity_type: "PERUSAHAAN",
        current_role: "Holding Operasional Danantara (Danantara Asset Management)",
        organization: "BPI Danantara Indonesia",
        sector: "Holding Operasional",
        transaction_value_idr_t: 9353.4,
        year_active: 2025,
        verification_status: "TERBUKTI",
        summary:
          "BUMN jasa survei dan klasifikasi yang ditetapkan melalui PP No. 15 Tahun 2025 sebagai kendaraan Holding Operasional penerima pengalihan (inbreng) Saham Seri B dan Seri C ratusan BUMN di bawah Danantara.",
        positions_history: [
          {
            period: "Mar 2025 - Sekarang",
            role: "Holding Operasional / Danantara Asset Management",
            institution: "BPI Danantara (PP No. 15/2025)",
            source_ref: "DOC-PP-15-2025, hlm. 1",
            status: "TERBUKTI",
          },
        ],
        chronology: [
          {
            date: "2025-03-21",
            title: "Penetapan Skema Inbreng Saham melalui PP No. 15/2025",
            description:
              "Dipilih pemerintah karena struktur neraca bersih tanpa beban utang korporasi besar.",
            doc_id: "DOC-PP-15-2025",
            status: "TERBUKTI",
          },
        ],
        key_metrics: [
          {
            label: "Cakupan Entitas",
            value: "800+ BUMN, Anak & Cucu",
            note: "Sasaran konsolidasi & restrukturisasi",
          },
        ],
      },
      {
        id: "ENT-BMRI",
        slug: "pt-bank-mandiri-persero-tbk",
        name: "PT Bank Mandiri (Persero) Tbk",
        entity_type: "PERUSAHAAN",
        current_role: "BUMN Inti Perbankan (Emiten BMRI)",
        organization: "Konsolidasi Holding Operasional Danantara",
        sector: "Perbankan",
        transaction_value_idr_t: 2427.22,
        year_active: 2024,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Entitas dengan total aset terbesar di antara 7 BUMN awal Danantara (Rp2.427,22 triliun pada FY 2024), membukukan laba bersih Rp55,80 triliun dan menyetor dividen Rp17,1 triliun pada 2024.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "1 dari 7 BUMN Inti Tahap Awal Danantara",
            institution: "Ekosistem BPI Danantara",
            source_ref: "DOC-BUMN-FIN-2024, hlm. 1",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Masuk Daftar 7 BUMN Awal Penggerak Danantara",
            description:
              "Menyumbang 25,9% dari total aset bruto konsolidasi 7 BUMN utama.",
            doc_id: "DOC-BUMN-FIN-2024",
            status: "TERDOKUMENTASI",
          },
        ],
        key_metrics: [
          { label: "Total Aset FY 2024", value: "Rp2.427,22 T", note: "Laporan Keuangan 2024" },
          { label: "Laba Bersih FY 2024", value: "Rp55,80 T", note: "Tumbuh dari Rp55,10 T (2023)" },
          { label: "Setoran Dividen 2024", value: "Rp17,10 T", note: "Terbesar kedua nasional" },
        ],
      },
      {
        id: "ENT-BBRI",
        slug: "pt-bank-rakyat-indonesia-persero-tbk",
        name: "PT Bank Rakyat Indonesia (Persero) Tbk (BRI)",
        entity_type: "PERUSAHAAN",
        current_role: "BUMN Inti Perbankan & Penyumbang Dividen Terbesar (BBRI)",
        organization: "Konsolidasi Holding Operasional Danantara",
        sector: "Perbankan",
        transaction_value_idr_t: 1992.98,
        year_active: 2024,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Penyumbang dividen BUMN terbesar di Indonesia (Rp25,7 triliun pada 2024) dengan laba bersih Rp60,64 triliun dan total aset Rp1.992,98 triliun.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "1 dari 7 BUMN Inti Tahap Awal Danantara",
            institution: "Ekosistem BPI Danantara",
            source_ref: "DOC-BUMN-FIN-2024, hlm. 1",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Konsolidasi ke Ekosistem Danantara",
            description:
              "Menyumbang 30% dari total seluruh dividen BUMN nasional tahun 2024.",
            doc_id: "DOC-BUMN-FIN-2024",
            status: "TERDOKUMENTASI",
          },
        ],
        key_metrics: [
          { label: "Total Aset FY 2024", value: "Rp1.992,98 T", note: "Laporan Keuangan 2024" },
          { label: "Laba Bersih FY 2024", value: "Rp60,64 T", note: "Naik tipis 0,36% dari 2023" },
          { label: "Setoran Dividen 2024", value: "Rp25,70 T", note: "Peringkat #1 nasional" },
        ],
      },
      {
        id: "ENT-PLN",
        slug: "pt-pln-persero",
        name: "PT PLN (Persero)",
        entity_type: "PERUSAHAAN",
        current_role: "BUMN Inti Kelistrikan & Pelaksana PSO Energi",
        organization: "Konsolidasi Holding Operasional Danantara",
        sector: "Energi & Kelistrikan",
        transaction_value_idr_t: 1699.06,
        year_active: 2024,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Pemegang aset infrastruktur energi terbesar ketiga (Rp1.699,06 triliun pada FY 2024) sekaligus pelaksana penugasan layanan publik (PSO) dan penerima subsidi/kompensasi energi APBN.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "1 dari 7 BUMN Inti Tahap Awal Danantara",
            institution: "Ekosistem BPI Danantara",
            source_ref: "DOC-BUMN-FIN-2024, hlm. 1",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Masuk 7 BUMN Awal Danantara",
            description:
              "Peran ganda PSO dan entitas korporasi di bawah Danantara tetap berada dalam lingkup audit dana publik BPK.",
            doc_id: "DOC-BUMN-FIN-2024",
            status: "TERDOKUMENTASI",
          },
        ],
        key_metrics: [
          { label: "Total Aset FY 2024", value: "Rp1.699,06 T", note: "Mayoritas aset tetap pembangkit & jaringan" },
          { label: "Setoran Dividen 2024", value: "Rp3,00 T", note: "Rilis Kementerian BUMN 2024" },
        ],
      },
      {
        id: "ENT-PERTAMINA",
        slug: "pt-pertamina-persero",
        name: "PT Pertamina (Persero)",
        entity_type: "PERUSAHAAN",
        current_role: "BUMN Inti Minyak, Gas & Energi Nasional",
        organization: "Konsolidasi Holding Operasional Danantara",
        sector: "Minyak & Gas",
        transaction_value_idr_t: 1526.98,
        year_active: 2024,
        verification_status: "TERDOKUMENTASI",
        summary:
          "BUMN energi nasional dengan total aset Rp1.526,98 triliun, prognosa laba operasional/bersih 2024 sekitar Rp45,50 triliun (turun dibanding Rp66,11 triliun pada 2023), serta setoran dividen Rp9,3 triliun pada 2024.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "1 dari 7 BUMN Inti Tahap Awal Danantara",
            institution: "Ekosistem BPI Danantara",
            source_ref: "DOC-BUMN-FIN-2024, hlm. 1",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Konsolidasi ke Ekosistem Danantara",
            description:
              "Pengelolaan PSO BBM dan rantai pasok migas menuntut pengawasan ketat tata kelola pengadaan.",
            doc_id: "DOC-BUMN-FIN-2024",
            status: "TERDOKUMENTASI",
          },
        ],
        key_metrics: [
          { label: "Total Aset FY 2024", value: "Rp1.526,98 T", note: "Konsolidasi grup energi" },
          { label: "Setoran Dividen 2024", value: "Rp9,30 T", note: "Peringkat #4 nasional" },
        ],
      },
      {
        id: "ENT-BBNI",
        slug: "pt-bank-negara-indonesia-persero-tbk",
        name: "PT Bank Negara Indonesia (Persero) Tbk (BNI)",
        entity_type: "PERUSAHAAN",
        current_role: "BUMN Inti Perbankan Korporasi & Internasional (BBNI)",
        organization: "Konsolidasi Holding Operasional Danantara",
        sector: "Perbankan",
        transaction_value_idr_t: 1129.8,
        year_active: 2024,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Bank BUMN dengan total aset Rp1.129,80 triliun, laba bersih 2024 sekitar Rp21,50 triliun, dan kontribusi dividen Rp6,2 triliun pada 2024.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "1 dari 7 BUMN Inti Tahap Awal Danantara",
            institution: "Ekosistem BPI Danantara",
            source_ref: "DOC-BUMN-FIN-2024, hlm. 1",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [],
        key_metrics: [
          { label: "Total Aset FY 2024", value: "Rp1.129,80 T", note: "Laporan Keuangan 2024" },
          { label: "Laba Bersih FY 2024", value: "Rp21,50 T", note: "Naik dari Rp20,90 T (2023)" },
          { label: "Setoran Dividen 2024", value: "Rp6,20 T", note: "Peringkat #6 nasional" },
        ],
      },
      {
        id: "ENT-MINDID",
        slug: "pt-mineral-industri-indonesia-mind-id",
        name: "PT Mineral Industri Indonesia (MIND ID)",
        entity_type: "PERUSAHAAN",
        current_role: "Holding Industri Pertambangan & Hilirisasi Mineral",
        organization: "Konsolidasi Holding Operasional Danantara",
        sector: "Pertambangan & Hilirisasi",
        transaction_value_idr_t: 292.23,
        year_active: 2024,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Holding pertambangan negara (Antam, Bukit Asam, Inalum, Timah, saham Freeport Indonesia, Vale Indonesia) dengan aset konsolidasi Rp292,23 triliun, lonjakan laba bersih 46% ke Rp40,2 triliun (2024), dan dividen Rp11,2 triliun.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "1 dari 7 BUMN Inti & Pilar Hilirisasi Danantara",
            institution: "Ekosistem BPI Danantara",
            source_ref: "DOC-BUMN-FIN-2024, hlm. 1",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [],
        key_metrics: [
          { label: "Total Aset Konsolidasi FY 2024", value: "Rp292,23 T", note: "Laporan Tahunan MIND ID" },
          { label: "Laba Bersih FY 2024", value: "Rp40,20 T", note: "Lonjakan +46% dari Rp27,5 T (2023)" },
          { label: "Setoran Dividen 2024", value: "Rp11,20 T", note: "Peringkat #3 nasional" },
        ],
      },
      {
        id: "ENT-TLKM",
        slug: "pt-telkom-indonesia-persero-tbk",
        name: "PT Telkom Indonesia (Persero) Tbk",
        entity_type: "PERUSAHAAN",
        current_role: "BUMN Inti Telekomunikasi & Infrastruktur Digital (TLKM)",
        organization: "Konsolidasi Holding Operasional Danantara",
        sector: "Telekomunikasi",
        transaction_value_idr_t: 285.13,
        year_active: 2024,
        verification_status: "TERDOKUMENTASI",
        summary:
          "Emiten telekomunikasi negara dengan total aset Rp285,13 triliun dan setoran dividen Rp9,2 triliun pada 2024.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "1 dari 7 BUMN Inti Tahap Awal Danantara",
            institution: "Ekosistem BPI Danantara",
            source_ref: "DOC-BUMN-FIN-2024, hlm. 1",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [],
        key_metrics: [
          { label: "Total Aset FY 2024", value: "Rp285,13 T", note: "Laporan Keuangan 2024" },
          { label: "Setoran Dividen 2024", value: "Rp9,20 T", note: "Peringkat #5 nasional" },
        ],
      },
      {
        id: "ENT-PROYEK-300T",
        slug: "alokasi-efisiensi-apbn-300-triliun-hilirisasi",
        name: "Skema Alokasi Efisiensi APBN Rp300 Triliun (20+ Proyek Strategis)",
        entity_type: "PROYEK",
        current_role: "Program Investasi Tahap Awal (US$20 Miliar)",
        organization: "Holding Investasi BPI Danantara",
        sector: "Pertambangan & Hilirisasi",
        transaction_value_idr_t: 300,
        year_active: 2025,
        verification_status: "BELUM TERVERIFIKASI",
        summary:
          "Pengalokasian dana hasil efisiensi belanja APBN sekitar Rp300 triliun (setara US$20 miliar) yang diumumkan pemerintah pada Februari 2025 untuk membiayai lebih dari 20 proyek hilirisasi, energi, pangan, dan industrialisasi. Hingga kini rincian studi kelayakan, daftar proyek lengkap, dan mitra swasta belum dibuka ke publik.",
        positions_history: [
          {
            period: "Feb 2025 - Sekarang",
            role: "Mandat Penempatan Modal Tahap Awal Danantara",
            institution: "Pemerintah RI / BPI Danantara",
            source_ref: "Pernyataan Peluncuran 24 Feb 2025 (Setkab)",
            status: "TERDOKUMENTASI",
          },
        ],
        chronology: [
          {
            date: "2025-02-24",
            title: "Pengumuman Alokasi US$20 Miliar / Rp300 Triliun",
            description:
              "Presiden mengumumkan pengalokasian dana efisiensi anggaran 100 hari kerja ke dalam portofolio investasi awal Danantara.",
            doc_id: "DOC-AUDIT-2026-Q4",
            status: "TERDOKUMENTASI",
          },
        ],
        key_metrics: [
          { label: "Nilai Alokasi Diumumkan", value: "Rp300 Triliun (~US$20 M)", note: "Sumber: Efisiensi APBN 2025" },
          { label: "Rincian Proyek & Mitra", value: "Belum Terbuka Publik", note: "Menunggu publikasi daftar resmi" },
        ],
      },
    ];

    const insertEntity = db.prepare(
      `INSERT OR REPLACE INTO entities (
        id, slug, name, entity_type, current_role, organization, sector,
        transaction_value_idr_t, year_active, verification_status, summary,
        positions_history_json, chronology_json, key_metrics_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const e of entities) {
      insertEntity.run(
        e.id,
        e.slug,
        e.name,
        e.entity_type,
        e.current_role,
        e.organization,
        e.sector,
        e.transaction_value_idr_t,
        e.year_active,
        e.verification_status,
        e.summary,
        JSON.stringify(e.positions_history),
        JSON.stringify(e.chronology),
        JSON.stringify(e.key_metrics),
        "2025-03-01T00:00:00Z",
        "2026-11-20T00:00:00Z"
      );
    }

    // 5. Entity Relations (Strictly documented institutional/legal relationships)
    const relations = [
      {
        id: "REL-01",
        src: "ENT-ROSAN",
        dst: "ENT-DANANTARA",
        type: "BADAN_PELAKSANA",
        desc: "Menjabat Group CEO BPI Danantara (sekaligus Menteri Investasi dan Hilirisasi saat pengangkatan).",
        period: "Feb 2025 - Sekarang",
        status: "TERBUKTI",
        doc: "DOC-KEPPRES-30-2025",
        ref: "Keppres No. 30/2025, hlm. 1",
      },
      {
        id: "REL-02",
        src: "ENT-DONY",
        dst: "ENT-DANANTARA",
        type: "BADAN_PELAKSANA",
        desc: "Menjabat Chief Operating Officer (COO) membawahi Holding Operasional (sekaligus Wakil Menteri BUMN saat dilantik).",
        period: "Feb 2025 - Sekarang",
        status: "TERBUKTI",
        doc: "DOC-KEPPRES-30-2025",
        ref: "Keppres No. 30/2025, hlm. 1",
      },
      {
        id: "REL-03",
        src: "ENT-PANDU",
        dst: "ENT-DANANTARA",
        type: "BADAN_PELAKSANA",
        desc: "Menjabat Chief Investment Officer (CIO) membawahi Holding Investasi.",
        period: "Feb 2025 - Sekarang",
        status: "TERBUKTI",
        doc: "DOC-KEPPRES-30-2025",
        ref: "Keppres No. 30/2025, hlm. 1",
      },
      {
        id: "REL-04",
        src: "ENT-ERICK",
        dst: "ENT-DANANTARA",
        type: "DEWAN_PENGAWAS",
        desc: "Ketua Dewan Pengawas BPI Danantara berdasarkan Keppres No. 30 Tahun 2025.",
        period: "Feb 2025 - Sekarang",
        status: "TERBUKTI",
        doc: "DOC-KEPPRES-30-2025",
        ref: "Keppres No. 30/2025, hlm. 1",
      },
      {
        id: "REL-05",
        src: "ENT-MULIAMAN",
        dst: "ENT-DANANTARA",
        type: "DEWAN_PENGAWAS",
        desc: "Wakil Ketua Dewan Pengawas BPI Danantara.",
        period: "Feb 2025 - Sekarang",
        status: "TERBUKTI",
        doc: "DOC-KEPPRES-30-2025",
        ref: "Keppres No. 30/2025, hlm. 1",
      },
      {
        id: "REL-06",
        src: "ENT-ADVISORS",
        dst: "ENT-DANANTARA",
        type: "DEWAN_PENASIHAT",
        desc: "Lima penasihat global (Ray Dalio, Jeffrey Sachs, Helman Sitohang, Chapman Taylor, Thaksin Shinawatra) memberi masukan strategi makro.",
        period: "Mar 2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-KEPPRES-30-2025",
        ref: "Pengumuman Struktur 24 Mar 2025, hlm. 2",
      },
      {
        id: "REL-07",
        src: "ENT-BP-BUMN",
        dst: "ENT-DANANTARA",
        type: "REGULATOR",
        desc: "Pemisahan peran regulator (BP BUMN pemegang 1% Saham Seri A Dwiwarna) dengan operator superholding (Danantara).",
        period: "Okt 2025 - Sekarang",
        status: "TERBUKTI",
        doc: "DOC-UU-16-2025",
        ref: "UU No. 16 Tahun 2025, hlm. 1",
      },
      {
        id: "REL-08",
        src: "ENT-DANANTARA",
        dst: "ENT-BKI",
        type: "HOLDING_OPERASIONAL",
        desc: "PT BKI ditetapkan sebagai kendaraan Holding Operasional (Danantara Asset Management) penerima inbreng saham Seri B & C BUMN.",
        period: "Mar 2025 - Sekarang",
        status: "TERBUKTI",
        doc: "DOC-PP-15-2025",
        ref: "PP No. 15 Tahun 2025, hlm. 1",
      },
      {
        id: "REL-09",
        src: "ENT-DONY",
        dst: "ENT-BKI",
        type: "HOLDING_OPERASIONAL",
        desc: "Mengarahkan konsolidasi operasional entitas BUMN yang bernaung di bawah Holding Operasional.",
        period: "Mar 2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-PP-15-2025",
        ref: "PP No. 10 & PP No. 15/2025",
      },
      {
        id: "REL-10",
        src: "ENT-PANDU",
        dst: "ENT-PROYEK-300T",
        type: "HOLDING_INVESTASI",
        desc: "Mengarahkan pilar investasi yang menjadi kendaraan penempatan modal proyek hilirisasi dan strategis.",
        period: "Feb 2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-AUDIT-2026-Q4",
        ref: "Dossier Pemantauan 2026, hlm. 1",
      },
      {
        id: "REL-11",
        src: "ENT-DANANTARA",
        dst: "ENT-PROYEK-300T",
        type: "ALOKASI_MODAL",
        desc: "Pengelolaan dana efisiensi APBN Rp300 triliun (~US$20 miliar) untuk 20+ proyek hilirisasi dan industrialisasi.",
        period: "Feb 2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-AUDIT-2026-Q4",
        ref: "Pengumuman Resmi 24 Feb 2025",
      },
      {
        id: "REL-12",
        src: "ENT-BKI",
        dst: "ENT-BMRI",
        type: "INBRENG_SAHAM",
        desc: "Konsolidasi kepemilikan tidak langsung Saham Seri B Bank Mandiri dalam ekosistem Holding Operasional (Aset FY24 Rp2.427,22 T).",
        period: "2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        ref: "PP No. 15/2025 & Data Keuangan 2024",
      },
      {
        id: "REL-13",
        src: "ENT-BKI",
        dst: "ENT-BBRI",
        type: "INBRENG_SAHAM",
        desc: "Konsolidasi kepemilikan tidak langsung Saham Seri B BRI (Aset FY24 Rp1.992,98 T; Dividen 2024 Rp25,7 T).",
        period: "2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        ref: "PP No. 15/2025 & Data Keuangan 2024",
      },
      {
        id: "REL-14",
        src: "ENT-BKI",
        dst: "ENT-PLN",
        type: "INBRENG_SAHAM",
        desc: "Konsolidasi PT PLN (Persero) sebagai BUMN inti energi (Aset FY24 Rp1.699,06 T).",
        period: "2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        ref: "Kompilasi Keuangan 7 BUMN, hlm. 1",
      },
      {
        id: "REL-15",
        src: "ENT-BKI",
        dst: "ENT-PERTAMINA",
        type: "INBRENG_SAHAM",
        desc: "Konsolidasi PT Pertamina (Persero) sebagai BUMN inti migas (Aset FY24 Rp1.526,98 T).",
        period: "2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        ref: "Kompilasi Keuangan 7 BUMN, hlm. 1",
      },
      {
        id: "REL-16",
        src: "ENT-BKI",
        dst: "ENT-BBNI",
        type: "INBRENG_SAHAM",
        desc: "Konsolidasi PT Bank Negara Indonesia Tbk (Aset FY24 Rp1.129,80 T).",
        period: "2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        ref: "Kompilasi Keuangan 7 BUMN, hlm. 1",
      },
      {
        id: "REL-17",
        src: "ENT-BKI",
        dst: "ENT-MINDID",
        type: "INBRENG_SAHAM",
        desc: "Konsolidasi MIND ID sebagai pilar pertambangan & hilirisasi mineral (Aset FY24 Rp292,23 T; Dividen Rp11,2 T).",
        period: "2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        ref: "Kompilasi Keuangan 7 BUMN, hlm. 1",
      },
      {
        id: "REL-18",
        src: "ENT-BKI",
        dst: "ENT-TLKM",
        type: "INBRENG_SAHAM",
        desc: "Konsolidasi PT Telkom Indonesia Tbk sebagai pilar infrastruktur digital (Aset FY24 Rp285,13 T; Dividen Rp9,2 T).",
        period: "2025 - Sekarang",
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        ref: "Kompilasi Keuangan 7 BUMN, hlm. 1",
      },
    ];

    const insertRel = db.prepare(
      `INSERT OR REPLACE INTO entity_relations (
        id, source_entity_id, target_entity_id, relation_type, description,
        period, verification_status, document_id, source_ref
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of relations) {
      insertRel.run(
        r.id,
        r.src,
        r.dst,
        r.type,
        r.desc,
        r.period,
        r.status,
        r.doc,
        r.ref
      );
    }

    // 6. Financial Records (FY 2023 & FY 2024 for all 7 flagship BUMN)
    const financials = [
      // FY 2024
      {
        id: "FIN-BMRI-2024",
        slug: "pt-bank-mandiri-persero-tbk",
        name: "PT Bank Mandiri (Persero) Tbk",
        ticker: "BMRI",
        sector: "Perbankan",
        year: 2024,
        assets: 2427.22,
        profit: 55.8,
        dividend: 17.1,
        equity: 289.4,
        liabilities: 2137.82,
        statePct: 52.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Aset terbesar di antara 7 BUMN awal; porsi liabilitas & simpanan nasabah (DPK) mendominasi neraca.",
      },
      {
        id: "FIN-BBRI-2024",
        slug: "pt-bank-rakyat-indonesia-persero-tbk",
        name: "PT Bank Rakyat Indonesia (Persero) Tbk",
        ticker: "BBRI",
        sector: "Perbankan",
        year: 2024,
        assets: 1992.98,
        profit: 60.64,
        dividend: 25.7,
        equity: 323.2,
        liabilities: 1669.78,
        statePct: 53.19,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Penyumbang dividen #1 nasional (Rp25,7 T atau 30% dari total dividen seluruh BUMN 2024).",
      },
      {
        id: "FIN-PLN-2024",
        slug: "pt-pln-persero",
        name: "PT PLN (Persero)",
        ticker: null,
        sector: "Energi & Kelistrikan",
        year: 2024,
        assets: 1699.06,
        profit: 17.8,
        dividend: 3.0,
        equity: 1025.0,
        liabilities: 674.06,
        statePct: 100.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Aset tetap infrastruktur ketenagalistrikan tinggi; kinerja dipengaruhi mekanisme subsidi & kompensasi PSO APBN.",
      },
      {
        id: "FIN-PERTAMINA-2024",
        slug: "pt-pertamina-persero",
        name: "PT Pertamina (Persero)",
        ticker: null,
        sector: "Minyak & Gas",
        year: 2024,
        assets: 1526.98,
        profit: 45.5,
        dividend: 9.3,
        equity: 685.0,
        liabilities: 841.98,
        statePct: 100.0,
        status: "PROGNOSA",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Laba bersih 2024 berbasis prognosa/laporan operasional (~Rp45,5 T), turun dibanding capaian 2023 (Rp66,11 T).",
      },
      {
        id: "FIN-BBNI-2024",
        slug: "pt-bank-negara-indonesia-persero-tbk",
        name: "PT Bank Negara Indonesia (Persero) Tbk",
        ticker: "BBNI",
        sector: "Perbankan",
        year: 2024,
        assets: 1129.8,
        profit: 21.5,
        dividend: 6.2,
        equity: 167.2,
        liabilities: 962.6,
        statePct: 60.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Mayoritas neraca merupakan dana pihak ketiga dan liabilitas perbankan.",
      },
      {
        id: "FIN-MINDID-2024",
        slug: "pt-mineral-industri-indonesia-mind-id",
        name: "PT Mineral Industri Indonesia (MIND ID)",
        ticker: null,
        sector: "Pertambangan & Hilirisasi",
        year: 2024,
        assets: 292.23,
        profit: 40.2,
        dividend: 11.2,
        equity: 142.5,
        liabilities: 149.73,
        statePct: 100.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Laba bersih melonjak +46% yoy dari Rp27,5 T pada 2023; penyumbang dividen #3 nasional.",
      },
      {
        id: "FIN-TLKM-2024",
        slug: "pt-telkom-indonesia-persero-tbk",
        name: "PT Telkom Indonesia (Persero) Tbk",
        ticker: "TLKM",
        sector: "Telekomunikasi",
        year: 2024,
        assets: 285.13,
        profit: 23.6,
        dividend: 9.2,
        equity: 162.4,
        liabilities: 122.73,
        statePct: 52.09,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Emiten infrastruktur digital dengan margin arus kas operasional stabil dan setoran dividen Rp9,2 T.",
      },
      // FY 2023 (for side-by-side period comparison)
      {
        id: "FIN-BMRI-2023",
        slug: "pt-bank-mandiri-persero-tbk",
        name: "PT Bank Mandiri (Persero) Tbk",
        ticker: "BMRI",
        sector: "Perbankan",
        year: 2023,
        assets: 2174.2,
        profit: 55.1,
        dividend: 16.5,
        equity: 263.1,
        liabilities: 1911.1,
        statePct: 52.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Periode pembanding tahun buku 2023 sebelum pembentukan Danantara.",
      },
      {
        id: "FIN-BBRI-2023",
        slug: "pt-bank-rakyat-indonesia-persero-tbk",
        name: "PT Bank Rakyat Indonesia (Persero) Tbk",
        ticker: "BBRI",
        sector: "Perbankan",
        year: 2023,
        assets: 1965.0,
        profit: 60.42,
        dividend: 23.2,
        equity: 316.5,
        liabilities: 1648.5,
        statePct: 53.19,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Periode pembanding tahun buku 2023.",
      },
      {
        id: "FIN-PLN-2023",
        slug: "pt-pln-persero",
        name: "PT PLN (Persero)",
        ticker: null,
        sector: "Energi & Kelistrikan",
        year: 2023,
        assets: 1670.6,
        profit: 22.07,
        dividend: 2.1,
        equity: 1011.0,
        liabilities: 659.6,
        statePct: 100.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Periode pembanding tahun buku 2023.",
      },
      {
        id: "FIN-PERTAMINA-2023",
        slug: "pt-pertamina-persero",
        name: "PT Pertamina (Persero)",
        ticker: null,
        sector: "Minyak & Gas",
        year: 2023,
        assets: 1413.0,
        profit: 66.11,
        dividend: 14.0,
        equity: 635.0,
        liabilities: 778.0,
        statePct: 100.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Laba 2023 sebesar Rp66,11 T (~US$4,4 miliar).",
      },
      {
        id: "FIN-BBNI-2023",
        slug: "pt-bank-negara-indonesia-persero-tbk",
        name: "PT Bank Negara Indonesia (Persero) Tbk",
        ticker: "BBNI",
        sector: "Perbankan",
        year: 2023,
        assets: 1086.7,
        profit: 20.9,
        dividend: 5.7,
        equity: 154.7,
        liabilities: 932.0,
        statePct: 60.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Periode pembanding tahun buku 2023.",
      },
      {
        id: "FIN-MINDID-2023",
        slug: "pt-mineral-industri-indonesia-mind-id",
        name: "PT Mineral Industri Indonesia (MIND ID)",
        ticker: null,
        sector: "Pertambangan & Hilirisasi",
        year: 2023,
        assets: 259.2,
        profit: 27.5,
        dividend: 7.4,
        equity: 129.0,
        liabilities: 130.2,
        statePct: 100.0,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Periode pembanding tahun buku 2023 sebelum lonjakan laba 2024.",
      },
      {
        id: "FIN-TLKM-2023",
        slug: "pt-telkom-indonesia-persero-tbk",
        name: "PT Telkom Indonesia (Persero) Tbk",
        ticker: "TLKM",
        sector: "Telekomunikasi",
        year: 2023,
        assets: 287.0,
        profit: 24.56,
        dividend: 8.6,
        equity: 156.6,
        liabilities: 130.4,
        statePct: 52.09,
        status: "TERDOKUMENTASI",
        doc: "DOC-BUMN-FIN-2024",
        notes: "Periode pembanding tahun buku 2023.",
      },
    ];

    const insertFin = db.prepare(
      `INSERT OR REPLACE INTO financial_records (
        id, entity_slug, entity_name, ticker, sector, fiscal_year,
        total_assets_idr_t, net_profit_idr_t, dividend_idr_t, equity_idr_t,
        customer_deposits_or_liabilities_idr_t, state_ownership_pct, data_status,
        source_doc_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const f of financials) {
      insertFin.run(
        f.id,
        f.slug,
        f.name,
        f.ticker,
        f.sector,
        f.year,
        f.assets,
        f.profit,
        f.dividend,
        f.equity,
        f.liabilities,
        f.statePct,
        f.status,
        f.doc,
        f.notes
      );
    }

    // 7. Eight Investigative Articles (covering all 6 categories)
    const articles = [
      {
        id: "ART-01",
        slug: "danantara-mengelola-aset-raksasa-mengapa-publik-sulit-melihat-detailnya",
        title:
          "Danantara Mengelola Aset Raksasa, Mengapa Publik Sulit Melihat Detailnya?",
        subtitle:
          "Pemerintah mempromosikan angka US$900 miliar, namun pemeriksaan atas laporan keuangan 7 BUMN inti menunjukkan total aset bruto Rp9.353,4 triliun yang mayoritas berupa simpanan nasabah bank, bukan uang tunai siap investasi.",
        excerpt:
          "Menguji selisih antara klaim Asset Under Management US$900 miliar dengan neraca teraudit tujuh BUMN awal Danantara, serta menagih rincian valuasi aset menjelang rilis laporan keuangan perdana.",
        category_slug: "investigasi-mendalam",
        verification_status: "TERDOKUMENTASI",
        is_featured: 1,
        cover_image: "/images/plate-neraca-aum.svg",
        cover_caption:
          "Perbandingan klaim AUM publik ~US$900 miliar terhadap total aset bruto 7 BUMN utama tahun buku 2024 dan setoran dividen aktual. Grafis: Desk Data Bongkar Danantara.",
        authors: "Tim Investigasi Keuangan & Data Bongkar Danantara",
        reading_time_min: 9,
        methodology:
          "Redaksi menghimpun laporan keuangan konsolidasian tahun buku 2023 dan 2024 dari tujuh BUMN inti (Bank Mandiri, BRI, BNI, PLN, Pertamina, MIND ID, dan Telkom), menyandingkannya dengan naskah UU No. 1/2025, rilis setoran dividen Kementerian BUMN 2024, serta pernyataan resmi pejabat pemerintah. Seluruh angka disajikan terpisah antara fakta teraudit, analisis neraca, dan klaim publik yang belum memiliki dokumen pendukung.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Angka Raksasa di Panggung Peluncuran vs Realitas Neraca",
            claim_type: "FAKTA",
            paragraphs: [
              "Ketika Presiden Prabowo Subianto meresmikan Badan Pengelola Investasi Daya Anagata Nusantara (BPI Danantara) di Istana Kepresidenan pada 24 Februari 2025, satu angka segera mendominasi pemberitaan nasional dan internasional: target kelolaan aset (Asset Under Management/AUM) menembus US$900 miliar, bahkan disebut berpotensi melewati US$1 triliun.",
              "Jika dikonversi dengan kurs kisaran Rp16.300 per dolar AS, US$900 miliar setara sekitar Rp14.670 triliun. Angka tersebut kerap dikutip untuk menempatkan Danantara sejajar dengan pengelola dana abadi negara (sovereign wealth fund) terbesar dunia seperti GPFG Norwegia atau Temasek Singapura.",
              "Namun, saat Bongkar Danantara menjumlahkan secara manual total aset bruto dari tujuh BUMN raksasa yang ditetapkan sebagai fondasi awal Danantara berdasarkan laporan keuangan tahun buku 2024, angka yang muncul adalah Rp9.353,40 triliun — terdiri atas Bank Mandiri (Rp2.427,22 T), BRI (Rp1.992,98 T), PLN (Rp1.699,06 T), Pertamina (Rp1.526,98 T), BNI (Rp1.129,80 T), MIND ID (Rp292,23 T), dan Telkom Indonesia (Rp285,13 T).",
            ],
            callout: {
              label: "VERIFIKASI HITUNGAN NERACA",
              text: "Total aset bruto 7 BUMN inti (Rp9.353,40 T) masih terpaut lebih dari Rp5.300 triliun dari klaim US$900 miliar. Pemerintah menyebut selisihnya mencakup seluruh BUMN lain dan aset negara seperti kawasan GBK, tetapi rincian tabel valuasi per aset belum pernah dibuka ke publik.",
              source_ref: "DOC-BUMN-FIN-2024, hlm. 1-2",
            },
          },
          {
            id: "sec-2",
            heading: "59,3 Persen Aset Berada di Tiga Bank: Itu Uang Nasabah, Bukan Kas Bebas",
            claim_type: "ANALISIS",
            paragraphs: [
              "Persoalan lebih mendasar bukan sekadar selisih antara Rp9.353,4 triliun dan Rp14.700 triliun, melainkan kualitas dan sifat hukum aset yang dijumlahkan tersebut.",
              "Dari total Rp9.353,40 triliun aset tujuh BUMN utama, sebesar Rp5.550,00 triliun — atau tepat 59,3 persen — berasal dari tiga bank milik negara: Bank Mandiri, BRI, dan BNI. Dalam prinsip akuntansi perbankan dasar, sisi aset bank (seperti kredit yang disalurkan dan surat berharga) dibiayai mayoritas oleh liabilitas berupa Dana Pihak Ketiga (simpanan masyarakat, giro, tabungan, dan deposito).",
              "Artinya, dana tersebut merupakan hak penabung yang terikat aturan rasio kecukupan modal (CAR) dan pengawasan ketat Otoritas Jasa Keuangan serta Bank Indonesia. Memperlakukan total aset bruto bank sebagai kapasitas investasi bebas Danantara berisiko menyesatkan ekspektasi publik maupun kreditor.",
              "Jika dilihat dari sisi arus kas nyata yang benar-benar bisa dialokasikan negara setiap tahunnya, ukurannya jauh lebih membumi: seluruh BUMN Indonesia menyetor dividen Rp85,5 triliun pada 2024, dan tujuh BUMN inti ini menyumbang Rp81,7 triliun (95,6%).",
            ],
          },
          {
            id: "sec-3",
            heading: "Risiko Keterbukaan Menjelang Rilis Laporan Keuangan Perdana",
            claim_type: "DUGAAN",
            paragraphs: [
              "Hingga memasuki November 2026 — ketika Danantara menjadwalkan pemaparan laporan keuangan konsolidasian perdana periode sembilan bulan operasional 2025 pasca-audit BPK — publik masih belum memiliki akses ke basis data transaksi per proyek, daftar kontrak konsultan atau penasihat global, maupun daftar lengkap mitra swasta dalam proyek hilirisasi.",
              "Tanpa keterbukaan tingkat transaksi (transaction-level disclosure), masyarakat tidak dapat menguji apakah penempatan modal baru didasarkan pada kelayakan komersial murni atau terdorong pesanan politik jangka pendek. Di sinilah risiko inefisiensi modal publik dan moral hazard muncul.",
            ],
            quote: {
              text: "Publikasi angka ringkasan tidak cukup memenuhi Santiago Principles; publik membutuhkan rekonsiliasi ekuitas bersih, daftar proyek dana Rp300 T, dan pemilik manfaat mitra swasta.",
              attribution: "Dossier Pemantauan Laporan Keuangan Perdana Danantara (2026)",
              page_ref: "DOC-AUDIT-2026-Q4, hlm. 1",
            },
          },
          {
            id: "sec-4",
            heading: "Apa yang Harus Segera Dibuka kepada Publik?",
            claim_type: "PERTANYAAN",
            paragraphs: [
              "Aset negara bukan milik segelintir elite dan bukan pula angka promosi untuk konferensi investor. Jika Danantara ingin memperoleh kepercayaan jangka panjang pasar domestik dan global, keterbukaan penuh justru menjadi pelindung terbaik lembaga tersebut.",
              "Publik berhak menuntut empat dokumen dasar segera dibuka dalam format dapat diunduh dan diaudit: (1) tabel rekonsiliasi lengkap klaim US$900 miliar versus ekuitas bersih konsolidasi, (2) opini dan catatan lengkap audit BPK tanpa pemotongan, (3) rincian alokasi dana efisiensi APBN Rp300 triliun per proyek, serta (4) daftar transaksi pihak berelasi sesuai PSAK.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERBUKTI",
            text: "Total aset bruto konsolidasi 7 BUMN awal pada tahun buku 2024 berjumlah Rp9.353,40 triliun.",
            doc_id: "DOC-BUMN-FIN-2024",
            page_ref: "hlm. 1",
          },
          {
            status: "TERDOKUMENTASI",
            text: "59,3% (Rp5.550,00 T) dari total aset 7 BUMN tersebut berada di tiga bank Himbara (Mandiri, BRI, BNI) yang mayoritas berupa dana nasabah/liabilitas.",
            doc_id: "DOC-BUMN-FIN-2024",
            page_ref: "hlm. 2",
          },
          {
            status: "BELUM TERVERIFIKASI",
            text: "Rincian daftar aset dan metode valuasi yang membentuk klaim publik AUM US$900 miliar belum dirilis terbuka.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 1",
          },
        ],
        unanswered_in_article: [
          "Daftar aset dan metode penilaian apa saja yang dipakai pemerintah untuk menghasilkan angka klaim US$900 miliar?",
          "Berapa nilai ekuitas bersih riil (setelah mengeluarkan liabilitas dan Dana Pihak Ketiga perbankan) yang dikendalikan langsung Danantara?",
          "Apakah seluruh catatan atas laporan keuangan (CALK) hasil audit BPK November 2026 akan dipublikasikan utuh ke masyarakat?",
        ],
        published_at: "2026-11-20",
        updated_at: "2026-11-23",
        entity_ids: [
          "ENT-DANANTARA",
          "ENT-BMRI",
          "ENT-BBRI",
          "ENT-PLN",
          "ENT-PERTAMINA",
          "ENT-BBNI",
          "ENT-MINDID",
          "ENT-TLKM",
        ],
        sources: [
          {
            id: "SRC-01-A",
            doc_id: "DOC-BUMN-FIN-2024",
            title: "Kompilasi Data Keuangan Konsolidasi 7 BUMN Utama (FY 2023-2024)",
            publisher: "Laporan Keuangan Tahunan 7 BUMN / BEI / Kementerian BUMN",
            url: "https://www.idx.co.id/",
            page_ref: "hlm. 1-2",
            quote:
              "Gabungan total aset bruto 7 BUMN utama mencapai Rp9.353,40 triliun; tiga bank Himbara mencakup 59,3% aset.",
            evidence_type: "TERDOKUMENTASI",
          },
          {
            id: "SRC-01-B",
            doc_id: "DOC-UU-01-2025",
            title: "UU Nomor 1 Tahun 2025 tentang Perubahan Ketiga atas UU BUMN",
            publisher: "Lembaran Negara Republik Indonesia",
            url: "https://peraturan.bpk.go.id/",
            page_ref: "hlm. 1",
            quote:
              "Modal awal BPI Danantara ditetapkan paling sedikit sebesar Rp1.000 triliun.",
            evidence_type: "TERBUKTI",
          },
          {
            id: "SRC-01-C",
            doc_id: "DOC-AUDIT-2026-Q4",
            title: "Dossier Pemantauan Laporan Keuangan Perdana Danantara (2025-2026)",
            publisher: "Tim Riset Bongkar Danantara / Rujukan Jadwal Audit BPK",
            url: "https://www.bpk.go.id/",
            page_ref: "hlm. 1",
            quote:
              "Danantara menjadwalkan pemaparan laporan keuangan konsolidasian perdananya setelah merampungkan proses audit bersama BPK.",
            evidence_type: "TERDOKUMENTASI",
          },
        ],
      },
      {
        id: "ART-02",
        slug: "bukan-kerugian-negara-bukan-penyelenggara-negara-menguji-pasal-uu-bumn-2025",
        title:
          "Bukan Kerugian Negara, Bukan Penyelenggara Negara: Menguji Pasal Rawan Impunitas di UU BUMN 2025",
        subtitle:
          "Pasal 3H ayat (2), Pasal 4B, Pasal 3X ayat (1), dan Pasal 9G UU No. 1/2025 merombak batas hukum kerugian korporasi. Sebelum MK memutus pokok gugatannya, DPR dan pemerintah sudah mengesahkan UU No. 16/2025.",
        excerpt:
          "Membedah pasal-pasal paling kontroversial dalam arsitektur hukum Danantara, batas doktrin Business Judgment Rule, dan bagaimana revisi UU BUMN kedua dalam setahun menggugurkan gugatan uji materi di Mahkamah Konstitusi.",
        category_slug: "kebijakan-bermasalah",
        verification_status: "TERBUKTI",
        is_featured: 1,
        cover_image: "/images/plate-bedah-pasal.svg",
        cover_caption:
          "Rekonstruksi pasal krusial UU No. 1/2025 dan kronologi putusan Mahkamah Konstitusi 30 Oktober 2025 pascarevisi UU No. 16/2025.",
        authors: "Desk Hukum & Regulasi Bongkar Danantara",
        reading_time_min: 8,
        methodology:
          "Analisis yuridis dilakukan melalui perbandingan teks norma UU No. 1 Tahun 2025, PP No. 10 Tahun 2025, UU No. 16 Tahun 2025, berkas permohonan dan amar Putusan MK tanggal 30 Oktober 2025 (Perkara 38, 43, 44, dan 80/PUU-XXIII/2025), serta bantahan resmi pimpinan Danantara.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Empat Pasal yang Mengubah Rezim Akuntabilitas Keuangan Publik",
            claim_type: "FAKTA",
            paragraphs: [
              "Di balik slogan efisiensi dan daya saing global, Undang-Undang Nomor 1 Tahun 2025 tentang Perubahan Ketiga atas UU BUMN memuat perubahan hukum yang sangat drastis terhadap status uang dan pengurus BUMN maupun BPI Danantara.",
              "Pasal 3H ayat (2) menetapkan bahwa keuntungan atau kerugian yang dialami Danantara dalam melaksanakan investasi merupakan keuntungan atau kerugian Badan. Rumusan senada tercantum dalam Pasal 4B yang menyatakan keuntungan atau kerugian BUMN merupakan keuntungan atau kerugian BUMN — memisahkannya dari definisi langsung kerugian keuangan negara.",
              "Lebih jauh lagi, Pasal 3X ayat (1) menetapkan organ dan pegawai Danantara bukan merupakan penyelenggara negara, sementara Pasal 9G dan Pasal 87 ayat (5) memberlakukan status serupa bagi anggota Direksi, Dewan Komisaris, Dewan Pengawas, serta karyawan BUMN.",
            ],
          },
          {
            id: "sec-2",
            heading: "Business Judgment Rule Bukan Kartu Bebas Hukum",
            claim_type: "ANALISIS",
            paragraphs: [
              "Argumen pemerintah dan pendukung revisi UU BUMN cukup jelas: direksi korporasi negara selama ini takut mengambil keputusan bisnis yang wajar karena khawatir risiko pasar dikriminalisasi sebagai tindak pidana korupsi (Pasal 2 dan 3 UU Tipikor). Di tingkat korporasi global, doktrin Business Judgment Rule (BJR) memang melindungi pengambil keputusan bisnis.",
              "Namun, para pakar hukum tata negara dan hukum pidana mengingatkan syarat kumulatif yang tidak boleh dipangkas: BJR hanya berlaku jika keputusan diambil dengan iktikad baik (good faith), kehati-hatian memadai, berbasis kajian objektif, dan bebas mutlak dari konflik kepentingan.",
              "Apabila status penyelenggara negara sekaligus dihapus tanpa aturan tegas mengenai kewajiban pelaporan kekayaan (LHKPN), deklarasi konflik kepentingan, dan delik suap-gratifikasi sektor korporasi publik, ruang gelap akuntabilitas melebar drastis.",
            ],
            callout: {
              label: "HAK JAWAB TERCATAT",
              text: "CEO Danantara Rosan Roeslani membantah anggapan Danantara kebal hukum. Ia menegaskan BPK tetap mengaudit keuangan konsolidasian Danantara dan KPK tetap berwenang menindak jika terdapat tindak pidana atau penyalahgunaan wewenang.",
              source_ref: "Arsip Hak Jawab #1 — Bantahan Resmi Feb 2025",
            },
          },
          {
            id: "sec-3",
            heading: "Mengapa Gugatan di Mahkamah Konstitusi Berakhir Kehilangan Objek?",
            claim_type: "FAKTA",
            paragraphs: [
              "Kekhawatiran publik tersebut dibawa ke Mahkamah Konstitusi oleh akademisi, praktisi hukum, dan mahasiswa dalam sejumlah perkara, antara lain Perkara Nomor 38, 43, 44, dan 80/PUU-XXIII/2025.",
              "Akan tetapi, sebelum Mahkamah Konstitusi memutus pokok konstitusionalitas pasal-pasal tersebut, pembentuk undang-undang mengesahkan UU Nomor 16 Tahun 2025 tentang Perubahan Keempat atas UU BUMN pada 6 Oktober 2025 — hanya tujuh bulan setelah UU No. 1/2025 berlaku.",
              "Pada 30 Oktober 2025, MK akhirnya memutus keempat perkara tersebut tidak dapat diterima karena kehilangan objek. Artinya secara hukum, substansi pemisahan kerugian negara dan standar pembuktian pidana di ekosistem Danantara belum pernah diuji tuntas oleh pengadilan konstitusi.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERBUKTI",
            text: "Pasal 3H(2), 4B, 3X(1), 9G, dan 87(5) UU No. 1/2025 memisahkan status kerugian korporasi dari kerugian negara dan mencabut label penyelenggara negara bagi organ Danantara/BUMN.",
            doc_id: "DOC-UU-01-2025",
            page_ref: "hlm. 2-3",
          },
          {
            status: "TERBUKTI",
            text: "Pada 30 Oktober 2025, MK memutus Perkara 38, 43, 44, dan 80/PUU-XXIII/2025 tidak dapat diterima karena kehilangan objek pascapengundangan UU No. 16/2025.",
            doc_id: "DOC-MK-2025-38",
            page_ref: "hlm. 2",
          },
          {
            status: "BANTAHAN",
            text: "Manajemen Danantara menyatakan lembaga tidak kebal hukum dan tunduk pada audit BPK serta kewenangan penindakan KPK atas unsur pidana.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 1",
          },
        ],
        unanswered_in_article: [
          "Bagaimana mekanisme hukum konkret bagi KPK dan Kejaksaan untuk membuktikan kerugian keuangan publik jika terjadi penyelewengan investasi di anak usaha Danantara?",
          "Apakah seluruh jajaran Direksi, Managing Director, dan Komite Investasi Danantara diwajibkan melaporkan LHKPN secara terbuka kepada publik?",
        ],
        published_at: "2026-11-12",
        updated_at: "2026-11-21",
        entity_ids: ["ENT-DANANTARA", "ENT-BP-BUMN", "ENT-ROSAN"],
        sources: [
          {
            id: "SRC-02-A",
            doc_id: "DOC-UU-01-2025",
            title: "UU Nomor 1 Tahun 2025 tentang Perubahan Ketiga atas UU BUMN",
            publisher: "Lembaran Negara RI",
            url: "https://peraturan.bpk.go.id/",
            page_ref: "Pasal 3H(2), 3X(1), 4B, 9G, 87(5), hlm. 2-3",
            quote:
              "Organ dan pegawai Badan serta Anggota Direksi, Dewan Komisaris, dan Dewan Pengawas BUMN bukan merupakan penyelenggara negara.",
            evidence_type: "TERBUKTI",
          },
          {
            id: "SRC-02-B",
            doc_id: "DOC-MK-2025-38",
            title: "Putusan MK Perkara No. 38, 43, 44, 80/PUU-XXIII/2025",
            publisher: "Mahkamah Konstitusi Republik Indonesia",
            url: "https://www.mkri.id/",
            page_ref: "hlm. 1-2",
            quote:
              "Permohonan dinyatakan tidak dapat diterima karena objek pengujian telah diubah oleh UU Nomor 16 Tahun 2025.",
            evidence_type: "TERBUKTI",
          },
          {
            id: "SRC-02-C",
            doc_id: "DOC-UU-16-2025",
            title: "UU Nomor 16 Tahun 2025 tentang Perubahan Keempat atas UU BUMN",
            publisher: "Lembaran Negara RI",
            url: "https://peraturan.bpk.go.id/",
            page_ref: "hlm. 1-2",
            quote:
              "Fungsi regulator dialihkan ke Badan Pengaturan BUMN (BP BUMN), sementara pengelolaan bisnis dan investasi berada di Danantara.",
            evidence_type: "TERBUKTI",
          },
        ],
      },
      {
        id: "ART-03",
        slug: "menteri-sekaligus-ceo-wakil-menteri-sekaligus-coo-siapa-mengawasi-siapa",
        title:
          "Menteri Sekaligus CEO, Wakil Menteri Sekaligus COO: Siapa Mengawasi Siapa di Tubuh Danantara?",
        subtitle:
          "Keppres Nomor 30 Tahun 2025 menempatkan pejabat aktif kabinet langsung di kursi pengelola harian sekaligus pengawas Danantara. Revisi UU No. 16/2025 mencoba memisahkan regulator dan operator, namun uji independensi tetap terbuka.",
        excerpt:
          "Memetakan arsitektur rangkap jabatan di puncak kepemimpinan Danantara, potensi disharmonisasi dengan UU Kementerian Negara, dan efektivitas pemisahan BP BUMN.",
        category_slug: "konflik-kepentingan",
        verification_status: "TERDOKUMENTASI",
        is_featured: 1,
        cover_image: "/images/plate-struktur-kekuasaan.svg",
        cover_caption:
          "Struktur organ BPI Danantara berdasarkan PP No. 10/2025, Keppres No. 30/2025, dan pengumuman struktur Maret 2025.",
        authors: "Desk Tata Kelola & Konflik Kepentingan Bongkar Danantara",
        reading_time_min: 7,
        methodology:
          "Pemetaan dilakukan murni berdasarkan dokumen penetapan jabatan publik (Keppres No. 30/2025, PP No. 10/2025, UU No. 16/2025) serta kajian literatur hukum administrasi negara. Pencatatan rangkap jabatan merupakan fakta struktural untuk menguji mekanisme pencegahan konflik kepentingan, bukan tuduhan tindak pidana.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Tumpukan Kewenangan pada Figur Kunci Kabinet",
            claim_type: "FAKTA",
            paragraphs: [
              "Ketika Keppres Nomor 30 Tahun 2025 diumumkan pada 24 Februari 2025, struktur pimpinan inti Danantara memperlihatkan pola rangkap jabatan di level tertinggi kekuasaan eksekutif dan korporasi negara.",
              "Rosan Perkasa Roeslani ditunjuk sebagai Group CEO Danantara sementara tetap mengemban tugas sebagai Menteri Investasi dan Hilirisasi / Kepala BKPM. Dony Oskaria ditetapkan sebagai Chief Operating Officer (COO) pengelola Holding Operasional sembari menjabat Wakil Menteri BUMN. Sementara kursi Ketua Dewan Pengawas ditempati Menteri BUMN Erick Thohir.",
            ],
          },
          {
            id: "sec-2",
            heading: "Titik Rawan Benturan Kepentingan Regulator vs Operator",
            claim_type: "DUGAAN",
            paragraphs: [
              "Dalam hukum administrasi negara dan standar OECD Guidelines on Corporate Governance of State-Owned Enterprises, fungsi regulator (penerbit izin, penetap kebijakan publik, pemberi insentif fiskal/investasi) wajib dipisahkan tegas dari fungsi operator korporasi.",
              "Ketika Menteri Investasi merangkap sebagai CEO pengelola investasi negara, muncul pertanyaan struktural yang sah dan mendesak: bagaimana menjamin kesetaraan perlakuan (level playing field) perizinan dan insentif antara proyek yang didanai Danantara dengan investor lain, serta bagaimana mencegah konflik alokasi waktu dan tanggung jawab hukum?",
              "Sejumlah akademisi hukum juga menyoroti potensi disharmonisasi norma dengan larangan rangkap jabatan dalam UU Kementerian Negara serta Asas-Asas Umum Pemerintahan yang Baik (AUPB).",
            ],
          },
          {
            id: "sec-3",
            heading: "Uji Nyata Pemisahan BP BUMN Pasca UU No. 16 Tahun 2025",
            claim_type: "KONTEKS",
            paragraphs: [
              "Pada 6 Oktober 2025, pengundangan UU No. 16 Tahun 2025 memperkenalkan Badan Pengaturan BUMN (BP BUMN) sebagai regulator terpisah yang memegang representasi 1% Saham Seri A Dwiwarna negara, sedangkan fungsi operasional dan investasi dikonsolidasikan di Danantara.",
              "Langkah ini mengakui secara implisit adanya problem desain kelembagaan awal. Namun, perubahan nomenklatur di atas kertas tidak otomatis menghilangkan irisan kepentingan apabila figur pembuat kebijakan dan pengelola tetap berasal dari lingkar birokrasi politik yang sama tanpa protokol cooling-off dan transparansi deklarasi kepentingan.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERBUKTI",
            text: "Keppres No. 30/2025 mengangkat pejabat aktif kabinet ke jajaran Badan Pelaksana dan Dewan Pengawas BPI Danantara.",
            doc_id: "DOC-KEPPRES-30-2025",
            page_ref: "hlm. 1",
          },
          {
            status: "DUGAAN",
            text: "Rangkap peran regulator investasi/BUMN dengan operator superholding menimbulkan risiko struktural konflik kepentingan dan ketidaksetaraan iklim usaha.",
            doc_id: "DOC-PP-10-2025",
            page_ref: "hlm. 1-2",
          },
          {
            status: "TERBUKTI",
            text: "UU No. 16/2025 membentuk BP BUMN untuk memisahkan regulator dari operator, tetapi standar keterbukaan konflik kepentingan per transaksi belum dipublikasikan.",
            doc_id: "DOC-UU-16-2025",
            page_ref: "hlm. 1",
          },
        ],
        unanswered_in_article: [
          "Apakah seluruh anggota Badan Pelaksana dan Dewan Pengawas telah menandatangani dan mempublikasikan deklarasi bebas benturan kepentingan (conflict-of-interest registry)?",
          "Bagaimana protokol recusal (pengunduran diri dari pengambilan keputusan) bila proyek Danantara bersinggungan dengan perizinan kementerian atau afiliasi bisnis masa lalu pengurus?",
        ],
        published_at: "2026-11-05",
        updated_at: "2026-11-18",
        entity_ids: [
          "ENT-ROSAN",
          "ENT-DONY",
          "ENT-PANDU",
          "ENT-ERICK",
          "ENT-MULIAMAN",
          "ENT-BP-BUMN",
          "ENT-DANANTARA",
        ],
        sources: [
          {
            id: "SRC-03-A",
            doc_id: "DOC-KEPPRES-30-2025",
            title: "Keppres No. 30 Tahun 2025 & Pengumuman Struktur Danantara",
            publisher: "Sekretariat Negara RI & BPI Danantara",
            url: "https://www.setneg.go.id/",
            page_ref: "hlm. 1",
            quote:
              "Rosan Roeslani sebagai Group CEO sekaligus Menteri Investasi; Dony Oskaria sebagai COO sekaligus Wakil Menteri BUMN.",
            evidence_type: "TERBUKTI",
          },
          {
            id: "SRC-03-B",
            doc_id: "DOC-PP-10-2025",
            title: "PP No. 10 Tahun 2025 tentang Organisasi dan Tata Kelola BPI Danantara",
            publisher: "Pemerintah Republik Indonesia",
            url: "https://peraturan.bpk.go.id/",
            page_ref: "hlm. 1",
            quote:
              "Organ BPI Danantara terdiri atas Dewan Pengawas dan Badan Pelaksana yang bertanggung jawab langsung kepada Presiden.",
            evidence_type: "TERBUKTI",
          },
        ],
      },
      {
        id: "ART-04",
        slug: "ke-mana-perginya-81-7-triliun-dividen-7-bumn-setelah-ditarik-dari-apbn",
        title:
          "Ke Mana Perginya Rp81,7 Triliun Dividen 7 BUMN Setelah Ditarik dari Jalur Langsung APBN?",
        subtitle:
          "Tujuh BUMN inti menyumbang 95,6% dari seluruh setoran dividen BUMN 2024 sebesar Rp85,5 triliun. Pengalihan aliran dividen ke kas investasi Danantara menggeser ruang pengawasan anggaran parlemen.",
        excerpt:
          "Menelusuri konsentrasi ekstrem dividen BUMN Indonesia, implikasinya terhadap penerimaan negara bukan pajak (PNBP) APBN, serta mekanisme pertanggungjawaban dana dividen di Holding Investasi Danantara.",
        category_slug: "jejak-uang",
        verification_status: "TERDOKUMENTASI",
        is_featured: 0,
        cover_image: "/images/plate-dividen-fiskal.svg",
        cover_caption:
          "Sebaran realisasi setoran dividen BUMN 2024: tujuh BUMN inti menyumbang Rp81,7 triliun dari total Rp85,5 triliun nasional.",
        authors: "Tim Investigasi Keuangan Bongkar Danantara",
        reading_time_min: 6,
        methodology:
          "Data dividen diambil dari realisasi setoran dividen BUMN tahun 2024 yang dirilis Kementerian BUMN dan laporan keterbukaan emiten Tbk, dibandingkan dengan skema pengelolaan dividen pasca UU No. 1/2025 dan UU No. 16/2025.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Ketergantungan Ekstrem pada Tujuh Mesin Laba Negara",
            claim_type: "FAKTA",
            paragraphs: [
              "Pada tahun 2024, seluruh BUMN Indonesia menyetor dividen sebesar Rp85,5 triliun ke kas negara — naik dari Rp81,2 triliun pada 2023. Namun di balik angka keseluruhan tersebut tersimpan ketimpangan tajam: sekitar 95,6 persen atau Rp81,7 triliun berasal hanya dari tujuh perusahaan.",
              "BRI memimpin di angka Rp25,7 triliun, diikuti Bank Mandiri (Rp17,1 triliun), MIND ID (Rp11,2 triliun), Pertamina (Rp9,3 triliun), Telkom (Rp9,2 triliun), BNI (Rp6,2 triliun), dan PLN (Rp3,0 triliun). Sementara ratusan entitas BUMN lainnya bersama-sama hanya menyumbang sekitar Rp3,8 triliun, dan sebagian besar anak/cucu BUMN masih mencatat rugi.",
            ],
          },
          {
            id: "sec-2",
            heading: "Pergeseran Jalur Fiskal: Dari APBN ke Pool Investasi Off-Budget",
            claim_type: "ANALISIS",
            paragraphs: [
              "Sebelum Danantara berdiri, dividen BUMN masuk langsung ke APBN sebagai Penerimaan Negara Bukan Pajak (PNBP) dari Kekayaan Negara Dipisahkan (KND). Penggunaannya harus melewati pembahasan publik dan persetujuan DPR RI melalui UU APBN — misalnya untuk belanja kesehatan, pendidikan, infrastruktur dasar, atau penambal defisit.",
              "Di bawah kerangka Danantara, dividen konsolidasi BUMN dialirkan ke lembaga pengelola investasi untuk diputar kembali sebagai modal proyek strategis. Secara ekonomi, reinvestasi dividen bisa menciptakan nilai tambah jika imbal hasilnya (ROI) lebih tinggi dari biaya utang negara (cost of funds). Sebaliknya, jika proyek yang dibiayai gagal atau merugi, negara menanggung kehilangan ganda: hilangnya penerimaan tunai APBN sekaligus beban penutupan defisit lewat penerbitan utang baru.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERBUKTI",
            text: "Tujuh BUMN inti menyumbang Rp81,7 triliun (95,6%) dari total Rp85,5 triliun realisasi dividen BUMN 2024.",
            doc_id: "DOC-BUMN-FIN-2024",
            page_ref: "hlm. 2",
          },
          {
            status: "ANALISIS" as unknown as "TERDOKUMENTASI",
            text: "Penahanan dividen di luar jalur langsung APBN membutuhkan publikasi realisasi imbal hasil (ROI/IRR) agar dibandingkan objektif dengan biaya utang SBN.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 1",
          },
        ].map((f) => ({
          ...f,
          status: f.status === ("ANALISIS" as unknown as "TERDOKUMENTASI") ? "TERDOKUMENTASI" : f.status,
        })),
        unanswered_in_article: [
          "Berapa persen dividen BUMN tahun buku 2025 yang disetor ke APBN versus yang ditahan di Holding Investasi Danantara?",
          "Berapa target minimal tingkat pengembalian (hurdle rate) proyek investasi Danantara dibandingkan bunga surat utang negara?",
        ],
        published_at: "2026-10-28",
        updated_at: "2026-11-15",
        entity_ids: [
          "ENT-DANANTARA",
          "ENT-BBRI",
          "ENT-BMRI",
          "ENT-MINDID",
          "ENT-PERTAMINA",
          "ENT-TLKM",
          "ENT-BBNI",
          "ENT-PLN",
        ],
        sources: [
          {
            id: "SRC-04-A",
            doc_id: "DOC-BUMN-FIN-2024",
            title: "Kompilasi Realisasi Dividen & Laba Bersih 7 BUMN (2023-2024)",
            publisher: "Kementerian BUMN / Antara / BEI",
            url: "https://www.idx.co.id/",
            page_ref: "hlm. 1-2",
            quote:
              "Dari total setoran dividen BUMN 2024 sebesar Rp85,5 triliun, ketujuh BUMN utama menyumbang Rp81,7 triliun atau 95,6%.",
            evidence_type: "TERDOKUMENTASI",
          },
        ],
      },
      {
        id: "ART-05",
        slug: "dewan-penasihat-global-dan-komite-pengawasan-peta-tokoh-lingkar-inti",
        title:
          "Dewan Penasihat Global dan Komite Pengawasan: Peta Tokoh di Lingkar Inti Danantara",
        subtitle:
          "Pengumuman struktur Maret 2025 menggabungkan mantan presiden, investor global, mantan PM Thailand, hingga pimpinan KPK, BPK, Kejaksaan, dan Polri dalam satu bagan kelembagaan.",
        excerpt:
          "Menelusuri peran dan batas kewenangan Dewan Pengarah, Dewan Penasihat Global, jajaran Managing Director, serta persoalan independensi Komite Pengawasan Danantara.",
        category_slug: "siapa-di-balik-kekuasaan",
        verification_status: "TERDOKUMENTASI",
        is_featured: 0,
        cover_image: "/images/plate-penasihat-global.svg",
        cover_caption:
          "Susunan Dewan Penasihat Global dan Komite Pengawasan BPI Danantara berdasarkan pengumuman resmi 24 Maret 2025.",
        authors: "Desk Database Kekuasaan Bongkar Danantara",
        reading_time_min: 7,
        methodology:
          "Seluruh nama dan jabatan diverifikasi dari pengumuman resmi struktur kepengurusan BPI Danantara pada 24 Maret 2025 yang dipublikasikan melalui kanal pemerintah dan media nasional terverifikasi.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Bagan Besar dari Mantan Kepala Negara hingga Tokoh Wall Street",
            claim_type: "FAKTA",
            paragraphs: [
              "Sebulan setelah peluncuran, tepatnya pada 24 Maret 2025, BPI Danantara merilis susunan kepengurusan lengkapnya. Struktur tersebut mencantumkan dua mantan presiden — Susilo Bambang Yudhoyono dan Joko Widodo — di jajaran Dewan Pengarah.",
              "Di level Dewan Penasihat (Board of Advisors), Danantara menempatkan lima figur berpengaruh internasional: pendiri Bridgewater Associates Ray Dalio, ekonom Columbia University Jeffrey Sachs, mantan CEO Asia Pasifik Credit Suisse Helman Sitohang, manajer portofolio Capital Group F. Chapman Taylor, serta mantan Perdana Menteri Thailand Thaksin Shinawatra.",
              "Untuk eksekusi harian, Badan Pelaksana dibantu sepuluh Managing Director, termasuk Robertus Billitea (Legal), Lieng-Seng Wee (Risk & Sustainability), Arief Budiman (Finance), Ali Setiawan (Treasury), dan Ahmad Hidayat (Internal Audit).",
            ],
          },
          {
            id: "sec-2",
            heading: "Dilema Independensi Ketika Penegak Hukum Duduk di Komite Pengawasan",
            claim_type: "ANALISIS",
            paragraphs: [
              "Satu elemen struktur Maret 2025 yang memicu perdebatan serius di kalangan ahli tata kelola adalah Komite Pengawasan dan Akuntabilitas. Komite tersebut mencantumkan unsur pimpinan KPK, BPK, BPKP, PPATK, Kapolri, dan Jaksa Agung.",
              "Pemerintah memandang keterlibatan mereka sebagai mekanisme pencegahan dini (early warning) agar tata kelola bersih sejak awal. Namun dari perspektif checks and balances, penempatan lembaga pemeriksa dan penegak hukum di dalam organ internal lembaga yang diawasi berpotensi mengaburkan jarak independensi penyidikan apabila di kemudian hari terjadi perkara pidana di proyek atau anak usaha Danantara.",
            ],
          },
          {
            id: "sec-3",
            heading: "Apa Mandat, Akses Informasi, dan Biaya Dewan Penasihat Global?",
            claim_type: "PERTANYAAN",
            paragraphs: [
              "Penunjukan figur berprofil tinggi — terutama tokoh politik asing seperti Thaksin Shinawatra maupun manajer investasi global aktif — menuntut penjelasan tegas soal batas keterlibatan mereka.",
              "Publik belum memperoleh akses atas kerangka acuan kerja (Terms of Reference) Dewan Penasihat: apakah mereka menerima informasi non-publik terkait tender atau valuasi aset BUMN Indonesia, apakah mereka terikat perjanjian larangan benturan kepentingan (NDA & non-compete), dan apakah jabatan tersebut dibayar dari anggaran badan.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERDOKUMENTASI",
            text: "Lima figur global (Ray Dalio, Jeffrey Sachs, Helman Sitohang, Chapman Taylor, Thaksin Shinawatra) tercatat resmi sebagai Dewan Penasihat pada pengumuman 24 Maret 2025.",
            doc_id: "DOC-KEPPRES-30-2025",
            page_ref: "hlm. 2",
          },
          {
            status: "TERDOKUMENTASI",
            text: "Unsur pimpinan PPATK, KPK, BPK, BPKP, Kapolri, dan Jaksa Agung tercantum dalam Komite Pengawasan dan Akuntabilitas.",
            doc_id: "DOC-KEPPRES-30-2025",
            page_ref: "hlm. 2",
          },
          {
            status: "BELUM TERVERIFIKASI",
            text: "Kerangka mandat tertulis, aturan akses data sensitif BUMN, dan struktur remunerasi Dewan Penasihat Global belum dipublikasikan.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 2",
          },
        ],
        unanswered_in_article: [
          "Berapa total anggaran remunerasi atau biaya operasional Dewan Penasihat Global Danantara per tahun?",
          "Bagaimana menjaga independensi penindakan KPK, BPK, dan Kejaksaan bila pimpinannya tercatat dalam Komite Pengawasan internal Danantara?",
        ],
        published_at: "2026-10-19",
        updated_at: "2026-11-10",
        entity_ids: [
          "ENT-DANANTARA",
          "ENT-ADVISORS",
          "ENT-ROSAN",
          "ENT-ERICK",
          "ENT-MULIAMAN",
        ],
        sources: [
          {
            id: "SRC-05-A",
            doc_id: "DOC-KEPPRES-30-2025",
            title: "Pengumuman Resmi Struktur Lengkap BPI Danantara (24 Maret 2025)",
            publisher: "BPI Danantara / IndonesiaBaik / Antara",
            url: "https://www.setneg.go.id/",
            page_ref: "hlm. 2",
            quote:
              "Dewan Penasihat diisi Ray Dalio, Helman Sitohang, Jeffrey Sachs, F. Chapman Taylor, dan Thaksin Shinawatra; Komite Pengawasan melibatkan PPATK, KPK, BPK, BPKP, Kapolri, dan Jaksa Agung.",
            evidence_type: "TERDOKUMENTASI",
          },
        ],
      },
      {
        id: "ART-06",
        slug: "buka-dokumennya-skema-inbreng-saham-bumn-ke-pt-biro-klasifikasi-indonesia",
        title:
          "Buka Dokumennya: Mengurai Skema Inbreng Saham Ratusan BUMN ke PT Biro Klasifikasi Indonesia",
        subtitle:
          "Melalui PP No. 15/2025, negara mengalihkan saham Seri B dan C ratusan BUMN ke PT BKI sebagai Holding Operasional sambil mempertahankan 1% Saham Seri A Dwiwarna.",
        excerpt:
          "Panduan dokumen terbuka atas mekanisme pengalihan saham (inbreng), alasan pemilihan BKI, penyelesaian utang antar-BUMN, serta pertanyaan mengenai fasilitas insentif pajak restrukturisasi.",
        category_slug: "dokumen-terbuka",
        verification_status: "TERBUKTI",
        is_featured: 0,
        cover_image: "/images/plate-bki-holding.svg",
        cover_caption:
          "Skema hukum pengalihan saham Seri B dan Seri C BUMN melalui PP Nomor 15 Tahun 2025 ke PT Biro Klasifikasi Indonesia (BKI).",
        authors: "Tim Arsip & Dokumen Terbuka Bongkar Danantara",
        reading_time_min: 6,
        methodology:
          "Disusun dari telaah PP Nomor 15 Tahun 2025, regulasi insentif pajak restrukturisasi, serta keterangan resmi pemerintah mengenai konsolidasi lebih dari 800 entitas BUMN, anak, dan cucu usaha.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Mengapa BUMN Jasa Survei Dipilih Menjadi Induk Ratusan BUMN?",
            claim_type: "FAKTA",
            paragraphs: [
              "Melalui Peraturan Pemerintah Nomor 15 Tahun 2025, PT Biro Klasifikasi Indonesia (Persero) atau BKI ditetapkan sebagai kendaraan utama Holding Operasional (Danantara Asset Management). Pemerintah menjelaskan pemilihan BKI didasarkan pada struktur neracanya yang bersih dan minim beban utang dibandingkan banyak BUMN sektor infrastruktur.",
              "Melalui skema penyertaan modal negara nontunai (inbreng), Saham Seri B dan Seri C milik negara pada perusahaan-perusahaan BUMN dialihkan kepemilikannya ke BKI. Negara tetap mempertahankan Saham Seri A Dwiwarna (1%) sebagai instrumen veto strategis yang kini berada di bawah koordinasi regulator BP BUMN.",
            ],
          },
          {
            id: "sec-2",
            heading: "Tiga Dokumen Turunan yang Wajib Dibuka ke Publik",
            claim_type: "PERTANYAAN",
            paragraphs: [
              "Aksi korporasi dengan skala konsolidasi ratusan perusahaan dan ribuan triliun rupiah aset ini dibarengi kebijakan insentif pajak restrukturisasi agar proses inbreng tidak membebani arus kas BUMN.",
              "Demi akuntabilitas publik dan perlindungan investor ritel di pasar modal (khususnya pada emiten Tbk seperti BMRI, BBRI, BBNI, dan TLKM), tiga dokumen teknis perlu dibuka: (1) ringkasan laporan penilaian independen (appraisal) nilai wajar inbreng, (2) peta penyelesaian ratusan utang-piutang antar-BUMN (inter-company liabilities), dan (3) daftar anak/cucu BUMN yang akan dilikuidasi atau dimerger beserta estimasi dampaknya terhadap tenaga kerja.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERBUKTI",
            text: "PP No. 15/2025 menjadikan PT BKI (Persero) sebagai Holding Operasional penerima inbreng saham Seri B & C BUMN.",
            doc_id: "DOC-PP-15-2025",
            page_ref: "hlm. 1",
          },
          {
            status: "BELUM TERVERIFIKASI",
            text: "Nilai estimasi potensi pajak transaksi yang dibebaskan lewat insentif restrukturisasi dan daftar anak/cucu BUMN yang akan ditutup belum dirinci publik.",
            doc_id: "DOC-PP-15-2025",
            page_ref: "hlm. 2",
          },
        ],
        unanswered_in_article: [
          "Berapa total nilai insentif pajak restrukturisasi yang diberikan negara dalam konsolidasi saham BUMN ke BKI?",
          "Perusahaan anak dan cucu BUMN mana saja yang masuk daftar likuidasi atau merger pada 2025-2026?",
        ],
        published_at: "2026-10-10",
        updated_at: "2026-11-02",
        entity_ids: ["ENT-BKI", "ENT-DANANTARA", "ENT-BP-BUMN", "ENT-DONY"],
        sources: [
          {
            id: "SRC-06-A",
            doc_id: "DOC-PP-15-2025",
            title: "PP Nomor 15 Tahun 2025 tentang Inbreng Saham BUMN ke PT BKI",
            publisher: "Pemerintah Republik Indonesia",
            url: "https://peraturan.bpk.go.id/",
            page_ref: "hlm. 1-2",
            quote:
              "Saham Seri B dan Seri C milik negara pada BUMN dialihkan melalui inbreng ke PT BKI sebagai Holding Operasional.",
            evidence_type: "TERBUKTI",
          },
        ],
      },
      {
        id: "ART-07",
        slug: "siapa-yang-diuntungkan-dari-alokasi-300-triliun-efisiensi-apbn",
        title:
          "Siapa yang Diuntungkan dari Keputusan Investasi Rp300 Triliun Dana Efisiensi APBN?",
        subtitle:
          "Pemangkasan belanja kementerian dan lembaga menghasilkan alokasi awal sekitar Rp300 triliun (US$20 miliar) untuk 20 lebih proyek hilirisasi. Tanpa daftar proyek dan pemilik manfaat mitra swasta, publik diminta percaya begitu saja.",
        excerpt:
          "Menagih transparansi penuh penggunaan dana efisiensi APBN Rp300 triliun di proyek strategis Danantara: siapa mitra swastanya, berapa proyeksi imbal hasilnya, dan siapa menanggung risiko jika merugi?",
        category_slug: "jejak-uang",
        verification_status: "BELUM TERVERIFIKASI",
        is_featured: 0,
        cover_image: "/images/plate-neraca-aum.svg",
        cover_caption:
          "Alokasi Rp300 triliun (~US$20 miliar) dana efisiensi anggaran menuntut keterbukaan daftar proyek dan mitra swasta.",
        authors: "Tim Investigasi Keuangan Bongkar Danantara",
        reading_time_min: 6,
        methodology:
          "Memverifikasi pernyataan resmi pemerintah mengenai sumber dana efisiensi APBN Rp300 triliun (~US$20 miliar) pada peluncuran 24 Februari 2025 dan memeriksa ketersediaan data proyek per November 2026.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Uang Pemangkasan Belanja Publik Masuk ke Wahana Investasi Korporasi",
            claim_type: "FAKTA",
            paragraphs: [
              "Pada peluncuran 24 Februari 2025, pemerintah mengumumkan pengalokasian sekitar Rp300 triliun (setara US$20 miliar) hasil efisiensi anggaran belanja APBN untuk menjadi modal investasi tahap awal Danantara yang diarahkan ke lebih dari 20 proyek strategis nasional, termasuk hilirisasi nikel, bauksit, tembaga, energi terbarukan, dan pangan.",
              "Berbeda dengan dana abadi berbasis surplus komoditas seperti di Norwegia, dana Rp300 triliun ini lahir dari realokasi dan penghematan belanja APBN — uang pajak masyarakat yang semula diperuntukkan bagi pos operasional dan layanan publik kementerian/lembaga.",
            ],
          },
          {
            id: "sec-2",
            heading: "Lubang Informasi Terbesar: Daftar Proyek, IRR, dan Beneficial Ownership",
            claim_type: "PERTANYAAN",
            paragraphs: [
              "Sampai menjelang akhir 2026, masyarakat belum dapat mengunduh satu pun dokumen publik terperinci yang memuat: (a) daftar 20+ proyek penerima dana Rp300 triliun berikut lokasi dan nilai komitmen masing-masing, (b) studi kelayakan komersial dan proyeksi tingkat pengembalian (IRR), serta (c) daftar lengkap perusahaan swasta atau konglomerasi mitra co-investment hingga ke pemilik manfaat akhirnya (beneficial owner).",
              "Tanpa keterbukaan beneficial ownership, publik tidak mungkin memverifikasi apakah proyek hilirisasi tersebut benar-benar dipilih secara kompetitif atau justru memberi keuntungan tidak semestinya kepada kelompok usaha yang memiliki kedekatan politik.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERDOKUMENTASI",
            text: "Pemerintah mengalokasikan sekitar Rp300 triliun (~US$20 miliar) dari efisiensi APBN 2025 untuk investasi awal 20+ proyek strategis Danantara.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 1",
          },
          {
            status: "BELUM TERVERIFIKASI",
            text: "Daftar lengkap nama proyek, nilai pencairan aktual, studi kelayakan, dan pemilik manfaat mitra swasta belum dipublikasikan ke masyarakat.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 1",
          },
        ],
        unanswered_in_article: [
          "Berapa realisasi pencairan aktual dari komitmen Rp300 triliun dana efisiensi APBN hingga kuartal IV 2026?",
          "Siapa saja mitra swasta domestik maupun asing dalam 20+ proyek hilirisasi tersebut dan bagaimana proses seleksinya?",
        ],
        published_at: "2026-11-16",
        updated_at: "2026-11-22",
        entity_ids: ["ENT-PROYEK-300T", "ENT-DANANTARA", "ENT-PANDU", "ENT-MINDID"],
        sources: [
          {
            id: "SRC-07-A",
            doc_id: "DOC-AUDIT-2026-Q4",
            title: "Dossier Pemantauan Keterbukaan Laporan Keuangan Perdana Danantara",
            publisher: "Bongkar Danantara / Rujukan Pernyataan Setkab 24 Feb 2025",
            url: "https://setkab.go.id/",
            page_ref: "hlm. 1",
            quote:
              "Rincian penuh daftar proyek investasi yang dibiayai dana efisiensi APBN Rp300 triliun beserta nilai komitmen dan pemilik manfaat mitra swasta wajib dibuka.",
            evidence_type: "TERDOKUMENTASI",
          },
        ],
      },
      {
        id: "ART-08",
        slug: "janji-transparansi-jangan-berakhir-menjadi-slogan-8-tolok-ukur-audit-2026",
        title:
          "Janji Transparansi Jangan Berakhir Menjadi Slogan: 8 Tolok Ukur Menguji Laporan Keuangan Perdana 2026",
        subtitle:
          "Danantara menjadwalkan paparan laporan keuangan konsolidasian perdana pasca-audit BPK pada November 2026. Berikut delapan parameter objektif untuk menilai apakah publik benar-benar diberi akses atau sekadar angka seremonial.",
        excerpt:
          "Menyusun standar evaluasi publik berbasis Santiago Principles dan PSAK untuk membedah laporan keuangan perdana Danantara periode 9 bulan operasional 2025.",
        category_slug: "kebijakan-bermasalah",
        verification_status: "BELUM TERVERIFIKASI",
        is_featured: 0,
        cover_image: "/images/plate-dividen-fiskal.svg",
        cover_caption:
          "Delapan indikator keterbukaan minimum yang menjadi tolok ukur audit laporan keuangan perdana Danantara November 2026.",
        authors: "Dewan Redaksi & Tim Akuntansi Forensik Bongkar Danantara",
        reading_time_min: 5,
        methodology:
          "Indikator disusun merujuk pada Santiago Principles (International Forum of Sovereign Wealth Funds / IFSWF), standar akuntansi PSAK pengungkapan pihak berelasi, dan praktik keterbukaan laporan tahunan GPFG Norwegia serta Temasek.",
        body_sections: [
          {
            id: "sec-1",
            heading: "Mengapa Opini Audit Saja Tidak Cukup Tanpa Lampiran Utuh?",
            claim_type: "ANALISIS",
            paragraphs: [
              "Rencana pemaparan laporan keuangan konsolidasian perdana Danantara pada November 2026 — mencakup sembilan bulan pertama operasional 2025 setelah diaudit BPK — merupakan ujian kredibilitas terbesar lembaga ini sejak diluncurkan.",
              "Pengalaman dari berbagai skandal dana investasi negara di dunia, termasuk 1MDB di Malaysia, menunjukkan bahwa keterbukaan palsu biasanya tampil dalam bentuk siaran pers optimistis tanpa menyertakan Catatan atas Laporan Keuangan (CALK) lengkap, rincian utang entitas tujuan khusus (SPV), dan transaksi pihak berelasi.",
            ],
          },
          {
            id: "sec-2",
            heading: "Delapan Syarat Minimum Keterbukaan yang Akan Kami Periksa",
            claim_type: "PERTANYAAN",
            paragraphs: [
              "Begitu laporan keuangan perdana dirilis, Bongkar Danantara akan mengunggah dokumen aslinya ke Vault Dokumen Terbuka dan mengujinya terhadap delapan tolok ukur: (1) rekonsiliasi AUM vs ekuitas bersih, (2) rincian proyek dana Rp300 triliun, (3) pemilik manfaat mitra swasta, (4) aliran penuh dividen BUMN 2025-2026, (5) opini dan temuan pengendalian intern BPK utuh, (6) rincian biaya operasional dan remunerasi pengurus/penasihat, (7) daftar anak/cucu BUMN yang ditutup atau dimerger, serta (8) tabel transaksi pihak berelasi sesuai PSAK.",
            ],
          },
        ],
        key_findings: [
          {
            status: "TERDOKUMENTASI",
            text: "Laporan keuangan perdana mencakup sekitar 9 bulan pertama operasional 2025 dan dijadwalkan dipaparkan setelah audit BPK pada November 2026.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 1",
          },
          {
            status: "BELUM TERVERIFIKASI",
            text: "Belum ada kepastian apakah Catatan atas Laporan Keuangan (CALK) lengkap dan temuan pengendalian intern BPK akan dibuka ke masyarakat.",
            doc_id: "DOC-AUDIT-2026-Q4",
            page_ref: "hlm. 2",
          },
        ],
        unanswered_in_article: [
          "Apakah laporan keuangan konsolidasian perdana beserta seluruh Catatan atas Laporan Keuangan (CALK) akan dapat diunduh bebas oleh masyarakat?",
        ],
        published_at: "2026-11-19",
        updated_at: "2026-11-24",
        entity_ids: ["ENT-DANANTARA", "ENT-ROSAN", "ENT-BKI"],
        sources: [
          {
            id: "SRC-08-A",
            doc_id: "DOC-AUDIT-2026-Q4",
            title: "Daftar Periksa 8 Indikator Keterbukaan Laporan Keuangan Perdana Danantara",
            publisher: "Bongkar Danantara",
            url: "https://www.bpk.go.id/",
            page_ref: "hlm. 1-2",
            quote:
              "Catatan atas laporan keuangan wajib memuat pengungkapan transaksi pihak berelasi sesuai PSAK serta total biaya operasional dan remunerasi pengurus.",
            evidence_type: "TERDOKUMENTASI",
          },
        ],
      },
    ];

    const insertArt = db.prepare(
      `INSERT OR REPLACE INTO articles (
        id, slug, title, subtitle, excerpt, category_slug, verification_status,
        editorial_state, is_featured, cover_image, cover_caption, authors,
        reading_time_min, methodology, body_sections_json, key_findings_json,
        unanswered_in_article_json, published_at, updated_at, view_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertArtSrc = db.prepare(
      `INSERT OR REPLACE INTO article_sources (
        id, article_id, document_id, source_title, source_publisher,
        source_url, page_ref, quote_excerpt, evidence_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertArtEnt = db.prepare(
      `INSERT OR IGNORE INTO article_entities (article_id, entity_id) VALUES (?, ?)`
    );

    for (let idx = 0; idx < articles.length; idx++) {
      const a = articles[idx];
      insertArt.run(
        a.id,
        a.slug,
        a.title,
        a.subtitle,
        a.excerpt,
        a.category_slug,
        a.verification_status,
        a.is_featured,
        a.cover_image,
        a.cover_caption,
        a.authors,
        a.reading_time_min,
        a.methodology,
        JSON.stringify(a.body_sections),
        JSON.stringify(a.key_findings),
        JSON.stringify(a.unanswered_in_article),
        a.published_at,
        a.updated_at,
        1240 - idx * 115
      );

      for (const s of a.sources) {
        insertArtSrc.run(
          s.id,
          a.id,
          s.doc_id,
          s.title,
          s.publisher,
          s.url,
          s.page_ref,
          s.quote,
          s.evidence_type
        );
      }

      for (const entId of a.entity_ids) {
        insertArtEnt.run(a.id, entId);
      }
    }

    // 8. Article Corrections Log (Section 9)
    const corrections = [
      {
        id: "COR-01",
        article_id: "ART-01",
        date: "2026-11-23",
        type: "PEMBARUAN_DOKUMEN",
        summary:
          "Menambahkan konteks jadwal pemaparan laporan keuangan konsolidasian perdana Danantara periode 9 bulan operasional 2025 pasca-audit BPK pada November 2026.",
        prev: "Sebelumnya hanya mencatat belum adanya laporan keuangan konsolidasian hingga pertengahan 2026.",
        next: "Diperbarui dengan jadwal rilis laporan keuangan konsolidasian perdana November 2026 serta daftar periksa 8 indikator keterbukaan.",
        editor: "Dewan Redaksi Investigasi",
      },
      {
        id: "COR-02",
        article_id: "ART-02",
        date: "2026-11-21",
        type: "TAMBAHAN_HAK_JAWAB",
        summary:
          "Menautkan ringkasan bantahan resmi manajemen Danantara terkait yurisdiksi audit BPK dan kewenangan penindakan KPK langsung di badan artikel.",
        prev: "Tanggapan resmi sebelumnya hanya dicantumkan pada halaman Hak Jawab terpisah.",
        next: "Ditambahkan kotak Hak Jawab Tercatat di Bagian 2 artikel agar pembaca memperoleh konteks berimbang secara langsung.",
        editor: "Desk Hukum & Regulasi",
      },
      {
        id: "COR-03",
        article_id: "ART-04",
        date: "2026-11-15",
        type: "KOREKSI_DATA",
        summary:
          "Memperjelas satuan kumulatif aset 7 BUMN awal sebesar Rp9.353,40 triliun (atau sekitar Rp9,35 kuadriliun), mengoreksi kesalahan ketik ringkasan berita sekunder yang sempat menulis Rp9,3 triliun.",
        prev: "Kutipan sekunder menyebut Rp9,3 triliun.",
        next: "Diverifikasi ulang dengan penjumlahan manual 7 laporan keuangan BUMN: tepat Rp9.353,40 triliun.",
        editor: "Tim Data & Verifikasi",
      },
    ];

    const insertCor = db.prepare(
      `INSERT OR REPLACE INTO article_corrections (
        id, article_id, correction_date, correction_type, summary,
        previous_text, updated_text, editor_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const c of corrections) {
      insertCor.run(
        c.id,
        c.article_id,
        c.date,
        c.type,
        c.summary,
        c.prev,
        c.next,
        c.editor
      );
    }

    // 9. Timeline Events (10 verified milestones 2024 - 2026)
    const timeline = [
      {
        id: "TL-01",
        date: "2025-02-04",
        display: "4 Februari 2025",
        year: 2025,
        title: "DPR RI Sahkan Revisi Ketiga UU BUMN (Cikal Bakal UU No. 1/2025)",
        category: "REGULASI",
        status: "TERBUKTI",
        summary:
          "Rapat Paripurna DPR RI menyetujui RUU Perubahan Ketiga atas UU No. 19 Tahun 2003 tentang BUMN yang memberikan dasar hukum pembentukan BPI Danantara dengan modal awal minimal Rp1.000 triliun.",
        impact:
          "Mengubah struktur tata kelola BUMN nasional dengan memasukkan pasal pemisahan kerugian badan/BUMN dari kerugian negara serta status bukan penyelenggara negara bagi organ badan.",
        doc: "DOC-UU-01-2025",
        art: "bukan-kerugian-negara-bukan-penyelenggara-negara-menguji-pasal-uu-bumn-2025",
        ent: "bpi-danantara-indonesia",
      },
      {
        id: "TL-02",
        date: "2025-02-24",
        display: "24 Februari 2025",
        year: 2025,
        title: "Peluncuran Resmi BPI Danantara, UU No. 1/2025, PP No. 10/2025 & Keppres No. 30/2025",
        category: "KELEMBAGAAN",
        status: "TERBUKTI",
        summary:
          "Presiden Prabowo Subianto meluncurkan Danantara di Istana Kepresidenan bersama paket regulasi dasar, penunjukan Rosan Roeslani (CEO), Dony Oskaria (COO), Pandu Sjahrir (CIO), Erick Thohir (Ketua Dewas), Muliaman Hadad (Wakil Ketua Dewas), serta pengumuman alokasi Rp300 triliun dana efisiensi APBN.",
        impact:
          "Memulai konsolidasi 7 BUMN inti dengan klaim target AUM US$900 miliar, sekaligus memicu kritik publik atas rangkap jabatan menteri/wamen dan tata kelola pengawasan.",
        doc: "DOC-PP-10-2025",
        art: "danantara-mengelola-aset-raksasa-mengapa-publik-sulit-melihat-detailnya",
        ent: "bpi-danantara-indonesia",
      },
      {
        id: "TL-03",
        date: "2025-02-26",
        display: "26 Februari 2025",
        year: 2025,
        title: "Bantahan Resmi Manajemen: Danantara Tidak Kebal Hukum dan Diaudit BPK/KPK",
        category: "PENGAWASAN",
        status: "BANTAHAN",
        summary:
          "Menanggapi gelombang kritik publik mengenai pasal kerugian badan bukan kerugian negara, CEO Rosan Roeslani menegaskan bahwa Danantara tidak kebal hukum dan tetap dalam jangkauan audit BPK serta penindakan KPK.",
        impact:
          "Menjadi komitmen publik resmi yang terus diuji konsistensinya terhadap teks undang-undang dan keterbukaan dokumen audit.",
        doc: "DOC-AUDIT-2026-Q4",
        art: "bukan-kerugian-negara-bukan-penyelenggara-negara-menguji-pasal-uu-bumn-2025",
        ent: "rosan-perkasa-roeslani",
      },
      {
        id: "TL-04",
        date: "2025-03-21",
        display: "21 Maret 2025",
        year: 2025,
        title: "PP No. 15/2025: Penunjukan PT Biro Klasifikasi Indonesia sebagai Holding Operasional",
        category: "KEUANGAN",
        status: "TERBUKTI",
        summary:
          "Pemerintah menetapkan PT BKI (Persero) sebagai kendaraan Holding Operasional penerima pengalihan (inbreng) Saham Seri B dan Seri C ratusan entitas BUMN, sementara negara memegang Saham Seri A Dwiwarna.",
        impact:
          "Mengalihkan kepemilikan ratusan BUMN secara bertahap ke struktur holding berlapis dibarengi fasilitas insentif pajak restrukturisasi.",
        doc: "DOC-PP-15-2025",
        art: "buka-dokumennya-skema-inbreng-saham-bumn-ke-pt-biro-klasifikasi-indonesia",
        ent: "pt-biro-klasifikasi-indonesia-bki",
      },
      {
        id: "TL-05",
        date: "2025-03-24",
        display: "24 Maret 2025",
        year: 2025,
        title: "Pengumuman Struktur Lengkap: Dewan Pengarah, 5 Penasihat Global & Komite Pengawasan",
        category: "PENGANGKATAN",
        status: "TERDOKUMENTASI",
        summary:
          "Danantara mengumumkan SBY & Joko Widodo di Dewan Pengarah; Ray Dalio, Jeffrey Sachs, Helman Sitohang, Chapman Taylor, dan Thaksin Shinawatra di Dewan Penasihat; jajaran Managing Director; serta pimpinan KPK, BPK, BPKP, PPATK, Polri, dan Kejagung dalam Komite Pengawasan.",
        impact:
          "Memunculkan pertanyaan mengenai transparansi kontrak/remunerasi penasihat global serta pemisahan independensi lembaga penegak hukum.",
        doc: "DOC-KEPPRES-30-2025",
        art: "dewan-penasihat-global-dan-komite-pengawasan-peta-tokoh-lingkar-inti",
        ent: "dewan-penasihat-global-danantara",
      },
      {
        id: "TL-06",
        date: "2025-05-14",
        display: "Mei 2025",
        year: 2025,
        title: "Pendaftaran Gugatan Uji Materi UU No. 1/2025 ke Mahkamah Konstitusi",
        category: "HUKUM_MK",
        status: "TERBUKTI",
        summary:
          "Akademisi, praktisi hukum, dan mahasiswa mengajukan gugatan uji materi terhadap Pasal 3H(2), 3X(1), 4B, 9G, dan 87(5) UU No. 1/2025 (Perkara No. 38, 43, 44, dan 80/PUU-XXIII/2025).",
        impact:
          "Menghadirkan perdebatan konstitusional terbuka soal perlindungan keuangan negara di bawah Pasal 33 UUD 1945.",
        doc: "DOC-MK-2025-38",
        art: "bukan-kerugian-negara-bukan-penyelenggara-negara-menguji-pasal-uu-bumn-2025",
        ent: "bpi-danantara-indonesia",
      },
      {
        id: "TL-07",
        date: "2025-10-06",
        display: "6 Oktober 2025",
        year: 2025,
        title: "Pengundangan UU No. 16 Tahun 2025 (Perubahan Keempat UU BUMN) & Pembentukan BP BUMN",
        category: "REGULASI",
        status: "TERBUKTI",
        summary:
          "Hanya tujuh bulan setelah UU No. 1/2025 berlaku, pemerintah dan DPR mengesahkan UU No. 16/2025 yang membentuk Badan Pengaturan BUMN (BP BUMN) sebagai regulator pemegang 1% Saham Seri A Dwiwarna, terpisah dari Danantara sebagai operator.",
        impact:
          "Merespons sebagian kritik tumpang tindih regulator-operator, sekaligus mengubah objek norma yang sedang disidangkan di MK.",
        doc: "DOC-UU-16-2025",
        art: "menteri-sekaligus-ceo-wakil-menteri-sekaligus-coo-siapa-mengawasi-siapa",
        ent: "badan-pengaturan-bumn-bp-bumn",
      },
      {
        id: "TL-08",
        date: "2025-10-30",
        display: "30 Oktober 2025",
        year: 2025,
        title: "Putusan MK: Uji Materi UU No. 1/2025 Dinyatakan Tidak Dapat Diterima (Kehilangan Objek)",
        category: "HUKUM_MK",
        status: "TERBUKTI",
        summary:
          "Mahkamah Konstitusi memutus Perkara No. 38, 43, 44, dan 80/PUU-XXIII/2025 tidak dapat diterima karena pasal yang digugat telah diubah oleh UU No. 16/2025.",
        impact:
          "Pokok persoalan konstitusional terkait pemisahan kerugian negara dan status penyelenggara negara belum diputus substansinya oleh MK.",
        doc: "DOC-MK-2025-38",
        art: "bukan-kerugian-negara-bukan-penyelenggara-negara-menguji-pasal-uu-bumn-2025",
        ent: "bpi-danantara-indonesia",
      },
      {
        id: "TL-09",
        date: "2026-11-18",
        display: "November 2026",
        year: 2026,
        title: "Agenda Rilis Laporan Keuangan Konsolidasian Perdana Danantara Pasca-Audit BPK",
        category: "KEUANGAN",
        status: "BELUM TERVERIFIKASI",
        summary:
          "Danantara menjadwalkan pemaparan laporan keuangan konsolidasian perdana yang mencakup sekitar 9 bulan pertama operasional 2025 setelah menyelesaikan proses audit bersama BPK.",
        impact:
          "Menjadi ujian transparansi pertama untuk melihat rincian ekuitas bersih, alokasi dana Rp300 triliun, daftar proyek, dan transaksi pihak berelasi.",
        doc: "DOC-AUDIT-2026-Q4",
        art: "janji-transparansi-jangan-berakhir-menjadi-slogan-8-tolok-ukur-audit-2026",
        ent: "bpi-danantara-indonesia",
      },
    ];

    const insertTl = db.prepare(
      `INSERT OR REPLACE INTO timeline_events (
        id, event_date, display_date, year, title, category,
        verification_status, summary, impact_analysis, document_id,
        related_article_slug, related_entity_slug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const t of timeline) {
      insertTl.run(
        t.id,
        t.date,
        t.display,
        t.year,
        t.title,
        t.category,
        t.status,
        t.summary,
        t.impact,
        t.doc,
        t.art,
        t.ent
      );
    }

    // 10. Unanswered Questions Tracker (Section 3)
    const questions = [
      {
        id: "UQ-01",
        code: "Q-01",
        question:
          "Dokumen valuasi aset apa saja yang membentuk klaim AUM US$900 miliar (~Rp14.700 triliun), dan berapa nilai ekuitas bersih riil di luar Dana Pihak Ketiga perbankan?",
        context:
          "Total aset bruto 7 BUMN awal pada FY 2024 tercatat Rp9.353,40 triliun dengan 59,3% berasal dari 3 bank Himbara.",
        addressed_to: "Badan Pelaksana BPI Danantara & Kementerian Keuangan",
        category: "Jejak Uang",
        date_raised: "2025-03-05",
        status: "BELUM DIJAWAB",
        official_note: "Hingga November 2026 belum ditemukan tabel rekonsiliasi publik per aset.",
        art: "danantara-mengelola-aset-raksasa-mengapa-publik-sulit-melihat-detailnya",
        doc: "DOC-BUMN-FIN-2024",
      },
      {
        id: "UQ-02",
        code: "Q-02",
        question:
          "Di mana daftar lengkap 20+ proyek hilirisasi yang dibiayai dana efisiensi APBN Rp300 triliun (US$20 miliar), nilai komitmen per proyek, dan identitas pemilik manfaat mitra swastanya?",
        context:
          "Dana berasal dari penghematan belanja APBN 2025 yang merupakan uang pajak publik.",
        addressed_to: "Holding Investasi BPI Danantara (DIM)",
        category: "Jejak Uang",
        date_raised: "2025-03-12",
        status: "BELUM DIJAWAB",
        official_note: "Pemerintah baru menyampaikan sektor prioritas secara umum (hilirisasi, energi, pangan, digital).",
        art: "siapa-yang-diuntungkan-dari-alokasi-300-triliun-efisiensi-apbn",
        doc: "DOC-AUDIT-2026-Q4",
      },
      {
        id: "UQ-03",
        code: "Q-03",
        question:
          "Apakah seluruh Catatan atas Laporan Keuangan (CALK), daftar transaksi pihak berelasi, dan temuan pengendalian intern audit BPK akan dipublikasikan penuh kepada masyarakat?",
        context:
          "Laporan keuangan konsolidasian perdana periode 9 bulan 2025 dijadwalkan dirilis November 2026.",
        addressed_to: "BPI Danantara & Badan Pemeriksa Keuangan (BPK)",
        category: "Dokumen Terbuka",
        date_raised: "2026-11-18",
        status: "BELUM DIJAWAB",
        official_note: null,
        art: "janji-transparansi-jangan-berakhir-menjadi-slogan-8-tolok-ukur-audit-2026",
        doc: "DOC-AUDIT-2026-Q4",
      },
      {
        id: "UQ-04",
        code: "Q-04",
        question:
          "Bagaimana protokol pencegahan benturan kepentingan tertulis bagi pimpinan yang merangkap jabatan menteri/wakil menteri atau memiliki afiliasi bisnis swasta sebelumnya?",
        context:
          "Keppres No. 30/2025 menempatkan pejabat kabinet aktif di pucuk pimpinan Badan Pelaksana dan Dewan Pengawas.",
        addressed_to: "Dewan Pengawas BPI Danantara & BP BUMN",
        category: "Konflik Kepentingan",
        date_raised: "2025-03-01",
        status: "DIJAWAB PARSIAL",
        official_note:
          "UU No. 16/2025 memisahkan fungsi regulator ke BP BUMN, tetapi protokol deklarasi konflik kepentingan per transaksi belum dibuka publik.",
        art: "menteri-sekaligus-ceo-wakil-menteri-sekaligus-coo-siapa-mengawasi-siapa",
        doc: "DOC-KEPPRES-30-2025",
      },
      {
        id: "UQ-05",
        code: "Q-05",
        question:
          "Apa ruang lingkup kontrak, batas akses informasi rahasia BUMN, serta total biaya remunerasi lima anggota Dewan Penasihat Global Danantara?",
        context:
          "Dewan Penasihat melibatkan tokoh ekonomi dan politik internasional termasuk manajer investasi global aktif.",
        addressed_to: "Badan Pelaksana BPI Danantara",
        category: "Siapa di Balik Kekuasaan?",
        date_raised: "2025-03-26",
        status: "BELUM DIJAWAB",
        official_note: null,
        art: "dewan-penasihat-global-dan-komite-pengawasan-peta-tokoh-lingkar-inti",
        doc: "DOC-KEPPRES-30-2025",
      },
      {
        id: "UQ-06",
        code: "Q-06",
        question:
          "Berapa total nilai insentif pajak restrukturisasi yang dilepas negara dalam proses inbreng saham ratusan BUMN ke PT BKI, dan anak/cucu BUMN mana saja yang akan dilikuidasi?",
        context:
          "PP No. 15/2025 mengonsolidasikan ratusan entitas BUMN disertai kebijakan insentif pajak restrukturisasi.",
        addressed_to: "Holding Operasional (DAM / PT BKI) & Kementerian Keuangan",
        category: "Dokumen Terbuka",
        date_raised: "2025-04-08",
        status: "BELUM DIJAWAB",
        official_note: null,
        art: "buka-dokumennya-skema-inbreng-saham-bumn-ke-pt-biro-klasifikasi-indonesia",
        doc: "DOC-PP-15-2025",
      },
      {
        id: "UQ-07",
        code: "Q-07",
        question:
          "Apakah jajaran Badan Pelaksana, Managing Director, dan Direksi BUMN tetap diwajibkan melaporkan LHKPN terbuka pasca ketentuan 'bukan penyelenggara negara' dalam UU BUMN 2025?",
        context:
          "Pasal 3X(1) dan Pasal 9G UU No. 1/2025 memicu kekhawatiran pelemahan instrumen pengawasan gratifikasi dan LHKPN.",
        addressed_to: "BPI Danantara, BP BUMN & KPK",
        category: "Kebijakan Bermasalah",
        date_raised: "2025-05-20",
        status: "DIJAWAB PARSIAL",
        official_note:
          "Manajemen Danantara menyatakan tetap tunduk pada pengawasan KPK bila ada tindak pidana; kepastian regulasi teknis LHKPN publik masih ditunggu.",
        art: "bukan-kerugian-negara-bukan-penyelenggara-negara-menguji-pasal-uu-bumn-2025",
        doc: "DOC-UU-01-2025",
      },
    ];

    const insertUq = db.prepare(
      `INSERT OR REPLACE INTO unanswered_questions (
        id, code, question, context, addressed_to, category,
        date_raised, status, official_note, related_article_slug, related_doc_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const q of questions) {
      insertUq.run(
        q.id,
        q.code,
        q.question,
        q.context,
        q.addressed_to,
        q.category,
        q.date_raised,
        q.status,
        q.official_note,
        q.art,
        q.doc
      );
    }

    // 11. Right of Replies / Bantahan Resmi (Section 9)
    const replies = [
      {
        id: "ROR-01",
        name: "Rosan Perkasa Roeslani (BPI Danantara)",
        role: "Group Chief Executive Officer (CEO) BPI Danantara",
        date: "2025-02-26",
        art: "bukan-kerugian-negara-bukan-penyelenggara-negara-menguji-pasal-uu-bumn-2025",
        topic: "Bantahan Isu Kebal Hukum dan Kewenangan Audit BPK serta Penindakan KPK",
        claim:
          "Sejumlah akademisi, masyarakat sipil, dan pemohon uji materi MK menyoroti Pasal 3H(2), 4B, 3X(1), dan 9G UU No. 1/2025 berpotensi membatasi jangkauan audit serta penindakan tindak pidana korupsi.",
        response:
          "Manajemen BPI Danantara secara tegas membantah isu bahwa lembaga ini kebal hukum atau tidak dapat diawasi. CEO Danantara menegaskan BPK tetap memiliki kewenangan mengaudit pengelolaan keuangan lembaga serta entitas BUMN terutama yang berkaitan dengan dana publik dan kewajiban pelayanan publik (PSO), sedangkan KPK tetap berwenang menindak setiap dugaan tindak pidana korupsi atau penyalahgunaan wewenang.",
        note:
          "Catatan Verifikasi Redaksi: Pernyataan ini tercatat di berbagai media nasional dan sejalan dengan pelaksanaan audit laporan keuangan perdana bersama BPK pada 2026. Meski demikian, redaksi tetap mencatat perlunya kejelasan peraturan teknis mengenai pembuktian kerugian negara, kewajiban LHKPN, dan keterbukaan penuh dokumen hasil audit BPK.",
        url: "https://www.bpk.go.id/",
        status: "DIPUBLIKASIKAN",
      },
      {
        id: "ROR-02",
        name: "Pemerintah RI & Pembentuk UU (Penjelasan UU No. 16 Tahun 2025)",
        role: "DPR RI & Pemerintah Republik Indonesia",
        date: "2025-10-06",
        art: "menteri-sekaligus-ceo-wakil-menteri-sekaligus-coo-siapa-mengawasi-siapa",
        topic: "Pemisahan Fungsi Regulator (BP BUMN) dari Operator (Danantara) & Doktrin Business Judgment Rule",
        claim:
          "Struktur awal Februari 2025 dikritik mencampuradukkan peran regulator kebijakan dan operator bisnis korporasi serta menumpuk rangkap jabatan di kabinet.",
        response:
          "Melalui pengundangan UU Nomor 16 Tahun 2025 tentang Perubahan Keempat atas UU BUMN, pembentuk undang-undang memisahkan secara kelembagaan fungsi regulator ke Badan Pengaturan BUMN (BP BUMN) yang mewakili negara pada 1% Saham Seri A Dwiwarna, sementara Danantara berkedudukan murni sebagai pengelola investasi dan operasional. Penerapan Business Judgment Rule dimaksudkan agar direksi profesional tidak dikriminalisasi atas risiko bisnis wajar yang diambil dengan iktikad baik dan tanpa benturan kepentingan.",
        note:
          "Catatan Verifikasi Redaksi: Perubahan norma melalui UU No. 16/2025 terverifikasi pada Lembaran Negara tanggal 6 Oktober 2025. Redaksi tetap memantau implementasi pemisahan aktual di lapangan serta ketersediaan daftar deklarasi konflik kepentingan pengurus.",
        url: "https://peraturan.bpk.go.id/",
        status: "DIPUBLIKASIKAN",
      },
      {
        id: "ROR-03",
        name: "Manajemen BPI Danantara (Terkait Pemilihan PT BKI)",
        role: "Penjelasan Resmi Holding Operasional",
        date: "2025-03-25",
        art: "buka-dokumennya-skema-inbreng-saham-bumn-ke-pt-biro-klasifikasi-indonesia",
        topic: "Dasar Penunjukan PT Biro Klasifikasi Indonesia (Persero) sebagai Holding Operasional",
        claim:
          "Publik mempertanyakan mengapa BUMN survei maritim PT BKI dipilih menampung inbreng saham ratusan BUMN raksasa termasuk perbankan dan energi.",
        response:
          "Pemerintah menjelaskan PT BKI (Persero) dipilih sebagai kendaraan Holding Operasional (Danantara Asset Management) karena memiliki kondisi keuangan sehat, neraca yang bersih, dan tidak dibebani utang korporasi besar. Skema ini ditujukan untuk mempercepat restrukturisasi lebih dari 800 entitas BUMN, memangkas anak/cucu perusahaan yang merugi, dan menyelesaikan utang-piutang antar-BUMN tanpa mengganggu kendali strategis negara lewat Saham Seri A Dwiwarna.",
        note:
          "Catatan Verifikasi Redaksi: Alasan neraca bersih BKI terdokumentasi dalam penjelasan resmi PP No. 15/2025. Redaksi masih menantikan publikasi terbuka laporan penilaian wajar (appraisal) inbreng dan rincian nilai insentif pajak restrukturisasi.",
        url: "https://danantaraindonesia.co.id/",
        status: "DIPUBLIKASIKAN",
      },
      {
        id: "ROR-04",
        name: "Manajemen BPI Danantara (Jadwal Audit Perdana)",
        role: "BPI Danantara Indonesia",
        date: "2026-11-18",
        art: "janji-transparansi-jangan-berakhir-menjadi-slogan-8-tolok-ukur-audit-2026",
        topic: "Komitmen Rilis Laporan Keuangan Konsolidasian Perdana Pasca-Audit BPK",
        claim:
          "Masyarakat menuntut transparansi atas kinerja investasi dan aliran dividen setelah lebih dari satu tahun operasional Danantara.",
        response:
          "Danantara menyampaikan komitmen untuk merilis dan memaparkan secara terbuka laporan keuangan konsolidasian perdana periode 9 bulan pertama operasional tahun 2025 setelah merampungkan proses pemeriksaan bersama Badan Pemeriksa Keuangan (BPK).",
        note:
          "Catatan Verifikasi Redaksi: Komitmen publik ini akan diverifikasi redaksi segera setelah dokumen laporan keuangan auditan beserta Catatan atas Laporan Keuangan (CALK) lengkap dirilis ke publik.",
        url: "https://danantaraindonesia.co.id/",
        status: "DIPUBLIKASIKAN",
      },
    ];

    const insertRor = db.prepare(
      `INSERT OR REPLACE INTO right_of_replies (
        id, respondent_name, respondent_role, response_date, related_article_slug,
        topic, editorial_claim_summary, official_response_text,
        editorial_verification_note, source_url, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of replies) {
      insertRor.run(
        r.id,
        r.name,
        r.role,
        r.date,
        r.art,
        r.topic,
        r.claim,
        r.response,
        r.note,
        r.url,
        r.status,
        `${r.date}T09:00:00Z`
      );
    }

    // 12. Sample Whistleblower Queue Items (explicitly marked as internal verification demo intake)
    const sampleReports = [
      {
        id: "TIP-001",
        code: "BD-2026-4102-DEMO",
        pinHash: hashSecret("VERI-2026"),
        mode: "ANONIM",
        alias: null,
        contact: null,
        category: "Transparansi Proyek & Pengadaan",
        entities: "Holding Investasi / Mitra Proyek Hilirisasi (Contoh Uji Moderasi)",
        period: "Kuartal III 2025",
        val: "Tidak disebutkan",
        title: "[CONTOH ANTREAN VERIFIKASI] Permintaan Penelusuran Dokumen Tender Konsultan Valuasi",
        chronology:
          "Ini adalah entri contoh bawaan sistem untuk menguji alur kerja moderasi redaksi pada dashboard admin. Pelapor publik yang sebenarnya dapat mengirimkan kronologi rinci beserta lampiran dokumen PDF/gambar melalui halaman /lapor.",
        evDesc: "Belum ada lampiran fisik pada data uji sistem.",
        risk: "SEDANG",
        status: "VERIFIKASI_AWAL",
        pubNote:
          "Laporan telah diterima meja verifikasi redaksi. Tim sedang melakukan pemeriksaan kecocokan dokumen publik.",
        intNote:
          "Data uji alur moderasi bawaan (seed). Jangan dipublikasikan sebagai berita.",
        createdAt: "2026-11-20T10:15:00Z",
      },
      {
        id: "TIP-002",
        code: "BD-2026-7821-TEST",
        pinHash: hashSecret("CEK1-2026"),
        mode: "SAMARAN",
        alias: "Pemerhati Keuangan Publik",
        contact: "signal-redaksi-terpisah (ilustrasi)",
        category: "Pengelolaan Aset & Anak Usaha BUMN",
        entities: "Daftar Restrukturisasi Anak Usaha BUMN (Contoh Uji Moderasi)",
        period: "Semester I 2026",
        val: "N/A",
        title: "[CONTOH ANTREAN VERIFIKASI] Informasi Awal Rencana Penggabungan Anak Usaha Non-Inti",
        chronology:
          "Entri simulasi sistem untuk memverifikasi fungsi penyaringan, pembaruan status, serta balasan terpisah bagi pelapor berdasarkan kode pelacakan dan PIN akses.",
        evDesc: "Menunggu unggahan dokumen resmi rapat pemegang saham.",
        risk: "RENDAH",
        status: "DITERIMA",
        pubNote: "Laporan masuk antrean telaah awal tim redaksi.",
        intNote: "Entri simulasi untuk pengujian moderasi dashboard admin.",
        createdAt: "2026-11-22T14:30:00Z",
      },
    ];

    const insertTip = db.prepare(
      `INSERT OR IGNORE INTO whistleblower_reports (
        id, tracking_code, access_pin_hash, anonymity_mode, reporter_alias,
        contact_channel, category, subject_entities, incident_period,
        estimated_value, title, chronology, evidence_description,
        risk_level, moderation_status, editor_public_note, editor_internal_note,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const t of sampleReports) {
      insertTip.run(
        t.id,
        t.code,
        t.pinHash,
        t.mode,
        t.alias,
        t.contact,
        t.category,
        t.entities,
        t.period,
        t.val,
        t.title,
        t.chronology,
        t.evDesc,
        t.risk,
        t.status,
        t.pubNote,
        t.intNote,
        t.createdAt,
        t.createdAt
      );
    }

    db.exec("COMMIT");
    console.log("Database Bongkar Danantara berhasil diinisialisasi dan diisi data terverifikasi.");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  } finally {
    closeDb();
  }
}

seed().catch((err) => {
  console.error("Gagal menjalankan seed:", err);
  process.exit(1);
});
