"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Upload, CheckCircle2, AlertTriangle, Copy, Check } from "lucide-react";
import { IS_STATIC_EXPORT } from "@/lib/paths";

interface SubmissionReceipt {
  tracking_code: string;
  access_pin: string;
  attachment_sha256: string | null;
  moderation_status: string;
  notice: string;
}

export function WhistleblowerFormClient() {
  const [anonymityMode, setAnonymityMode] = useState<
    "ANONIM" | "SAMARAN" | "TERVERIFIKASI_RAHASIA"
  >("ANONIM");
  const [reporterAlias, setReporterAlias] = useState("");
  const [contactChannel, setContactChannel] = useState("");
  const [category, setCategory] = useState("Dugaan Konflik Kepentingan");
  const [subjectEntities, setSubjectEntities] = useState("");
  const [incidentPeriod, setIncidentPeriod] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [title, setTitle] = useState("");
  const [chronology, setChronology] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"RENDAH" | "SEDANG" | "TINGGI">(
    "SEDANG"
  );
  const [file, setFile] = useState<File | null>(null);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acknowledgedWarning) {
      setError(
        "Harap centang konfirmasi bahwa Anda telah membaca peringatan keamanan dan tidak menyertakan data pribadi yang tidak relevan."
      );
      return;
    }

    setSubmitting(true);
    try {
      if (IS_STATIC_EXPORT) {
        const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const randStr = (len: number) =>
          Array.from(
            { length: len },
            () => alphabet[Math.floor(Math.random() * alphabet.length)]
          ).join("");
        const tracking_code = `BD-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}-${randStr(4)}`;
        const access_pin = `${randStr(4)}-${randStr(4)}`;
        const now = new Date().toISOString();
        const existing = JSON.parse(
          localStorage.getItem("bd_static_reports") || "[]"
        ) as Array<Record<string, unknown>>;
        existing.unshift({
          tracking_code,
          access_pin,
          category,
          title,
          risk_level: riskLevel,
          moderation_status: "DITERIMA",
          editor_public_note:
            "Simulasi Mode Statis GitHub Pages: Laporan tercatat di penyimpanan peramban lokal Anda. Untuk penerimaan terisolasi server SQLite, jalankan instance Node.js.",
          attachment_original_name: file ? file.name : null,
          attachment_sha256: null,
          created_at: now,
          updated_at: now,
        });
        localStorage.setItem("bd_static_reports", JSON.stringify(existing));
        setReceipt({
          tracking_code,
          access_pin,
          attachment_sha256: null,
          moderation_status: "DITERIMA",
          notice:
            "Mode Arsip Statis GitHub Pages aktif: tidak ada data yang dikirim ke server eksternal; bukti penerimaan simulasi disimpan lokal di peramban Anda untuk pengujian alur pelacakan (/lapor/cek).",
        });
        return;
      }

      const fd = new FormData();
      fd.set("anonymity_mode", anonymityMode);
      if (anonymityMode !== "ANONIM") {
        fd.set("reporter_alias", reporterAlias);
        fd.set("contact_channel", contactChannel);
      }
      fd.set("category", category);
      fd.set("subject_entities", subjectEntities);
      fd.set("incident_period", incidentPeriod);
      fd.set("estimated_value", estimatedValue);
      fd.set("title", title);
      fd.set("chronology", chronology);
      fd.set("evidence_description", evidenceDescription);
      fd.set("risk_level", riskLevel);
      if (file) {
        fd.set("attachment", file);
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim laporan.");
        return;
      }

      setReceipt(data as SubmissionReceipt);
    } catch {
      setError("Terjadi gangguan koneksi saat mengirim laporan.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyReceipt() {
    if (!receipt) return;
    navigator.clipboard.writeText(
      `Kode Pelacakan: ${receipt.tracking_code}\nPIN Akses: ${receipt.access_pin}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (receipt) {
    return (
      <div className="bg-white border-2 border-[#166534] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 text-[#14532D]">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold">
            Laporan Diterima ke Antrean Moderasi Redaksi
          </h2>
        </div>

        <p className="text-sm sm:text-base text-[#1F1E1C] leading-relaxed">
          {receipt.notice}
        </p>

        <div className="bg-[#141414] text-white p-5 space-y-3 font-data">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[#A6A197]">
                KODE PELACAKAN LAPORAN
              </span>
              <span className="text-xl font-bold text-[#FCA5A5] tracking-wider">
                {receipt.tracking_code}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[#A6A197]">
                PIN AKSES PELAPOR (TAMPIL SATU KALI)
              </span>
              <span className="text-xl font-bold text-white tracking-wider">
                {receipt.access_pin}
              </span>
            </div>
          </div>

          {receipt.attachment_sha256 && (
            <div className="pt-3 border-t border-[#3D3B36] text-[11px] text-[#C7C2B6] break-all">
              SHA-256 Bukti Lampiran: {receipt.attachment_sha256}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyReceipt}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase tracking-wider"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Tersalin ke Clipboard
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin Kode &amp; PIN
              </>
            )}
          </button>

          <Link
            href="/lapor/cek"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#141414] bg-white hover:bg-[#EFECE6] font-data text-xs font-bold uppercase tracking-wider"
          >
            Cek Status Moderasi Laporan →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-[#141414] p-6 sm:p-8 space-y-6"
    >
      <div className="border-b border-[#D6D1C6] pb-4">
        <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
          FORMULIR PENGIRIMAN INFORMASI &amp; DOKUMEN
        </p>
        <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D] mt-1">
          Kirim Laporan untuk Verifikasi Independen
        </h2>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-[#FAF0F0] border-2 border-[#9E1B1B] p-4 text-sm text-[#781111] font-medium flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Anonymity Mode */}
      <fieldset className="space-y-2.5">
        <legend className="font-data text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
          1. Pilihan Identitas Pelapor
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                val: "ANONIM",
                title: "Anonim Penuh",
                desc: "Tanpa nama dan tanpa kontak. Gunakan Kode + PIN untuk memantau balasan redaksi.",
              },
              {
                val: "SAMARAN",
                title: "Nama Samaran + Kontak Aman",
                desc: "Sertakan alias dan kanal kontak terpisah (misal email terenkripsi/Signal) jika bersedia dikonfirmasi.",
              },
              {
                val: "TERVERIFIKASI_RAHASIA",
                title: "Identitas Dirahasiakan Redaksi",
                desc: "Identitas asli hanya diketahui editor verifikasi dan tidak akan dipublikasikan.",
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.val}
              className={`block p-3.5 border cursor-pointer transition-colors ${
                anonymityMode === opt.val
                  ? "border-[#9E1B1B] bg-[#FAF0F0]"
                  : "border-[#D6D1C6] bg-[#FAF9F6] hover:border-[#141414]"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="anonymity_mode"
                  value={opt.val}
                  checked={anonymityMode === opt.val}
                  onChange={() => setAnonymityMode(opt.val)}
                />
                <span className="font-semibold text-sm text-[#0D0D0D]">
                  {opt.title}
                </span>
              </div>
              <p className="text-xs text-[#5F5B53] mt-1.5 leading-relaxed">
                {opt.desc}
              </p>
            </label>
          ))}
        </div>
      </fieldset>

      {anonymityMode !== "ANONIM" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF9F6] border border-[#D6D1C6]">
          <div>
            <label
              htmlFor="alias"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Nama Samaran / Identitas (Dirahasiakan)
            </label>
            <input
              id="alias"
              type="text"
              value={reporterAlias}
              onChange={(e) => setReporterAlias(e.target.value)}
              placeholder="Contoh: Sumber Internal BUMN-A"
              className="w-full px-3 py-2 border border-[#141414] bg-white text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="contact"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Kanal Kontak Aman (Opsional)
            </label>
            <input
              id="contact"
              type="text"
              value={contactChannel}
              onChange={(e) => setContactChannel(e.target.value)}
              placeholder="Contoh: protonmail / username Signal terpisah"
              className="w-full px-3 py-2 border border-[#141414] bg-white text-sm"
            />
          </div>
        </div>
      )}

      {/* Report Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="category"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            2. Kategori Persoalan *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] text-sm"
          >
            <option>Dugaan Konflik Kepentingan</option>
            <option>Transaksi Investasi Tidak Transparan</option>
            <option>Dugaan Penyalahgunaan Wewenang / Korupsi</option>
            <option>Pengelolaan Aset &amp; Anak Usaha BUMN</option>
            <option>Penunjukan Pejabat &amp; Intervensi Politik</option>
            <option>Potensi Kerugian Keuangan Publik</option>
            <option>Dokumen Kebijakan / Laporan Internal</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="risk"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            Tingkat Risiko Keamanan Pelapor *
          </label>
          <select
            id="risk"
            value={riskLevel}
            onChange={(e) =>
              setRiskLevel(e.target.value as "RENDAH" | "SEDANG" | "TINGGI")
            }
            className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] text-sm"
          >
            <option value="RENDAH">RENDAH — Dokumen bersifat terbuka/umum</option>
            <option value="SEDANG">SEDANG — Informasi internal non-publik</option>
            <option value="TINGGI">TINGGI — Berisiko intimidasi/sanksi internal</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="entities"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            Entitas / Proyek / Instansi Terkait *
          </label>
          <input
            id="entities"
            type="text"
            required
            minLength={3}
            value={subjectEntities}
            onChange={(e) => setSubjectEntities(e.target.value)}
            placeholder="Contoh: Holding Investasi / Proyek Hilirisasi X / Anak Usaha BUMN Y"
            className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="period"
              className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
            >
              Periode Kejadian *
            </label>
            <input
              id="period"
              type="text"
              required
              minLength={3}
              value={incidentPeriod}
              onChange={(e) => setIncidentPeriod(e.target.value)}
              placeholder="Misal: Q3 2025"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="value"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Estimasi Nilai (Opsional)
            </label>
            <input
              id="value"
              type="text"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="Misal: Rp120 Miliar"
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            />
          </div>
        </div>
      </div>

      {/* Title & Chronology */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            3. Judul Ringkas Laporan *
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={10}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ringkas pokok persoalan dalam satu kalimat jelas..."
            className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="chronology"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            4. Kronologi Lengkap &amp; Fakta yang Dapat Diverifikasi *
          </label>
          <textarea
            id="chronology"
            rows={7}
            required
            minLength={30}
            value={chronology}
            onChange={(e) => setChronology(e.target.value)}
            placeholder="Jelaskan apa yang terjadi, kapan, siapa pembuat keputusannya, nomor surat/kontrak jika ada, serta di mana redaksi dapat memverifikasi fakta tersebut. Hindari menyertakan NIK, alamat rumah, atau data pribadi pihak yang tidak relevan."
            className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] text-sm leading-relaxed"
          />
        </div>

        <div>
          <label
            htmlFor="ev-desc"
            className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
          >
            Keterangan Dokumen Pendukung (Opsional)
          </label>
          <input
            id="ev-desc"
            type="text"
            value={evidenceDescription}
            onChange={(e) => setEvidenceDescription(e.target.value)}
            placeholder="Misal: Salinan surat keputusan, tabel rincian anggaran, atau notulensi rapat..."
            className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
          />
        </div>
      </div>

      {/* Secure Attachment Upload */}
      <div className="p-4 bg-[#FAF9F6] border border-dashed border-[#141414] space-y-2">
        <label
          htmlFor="attachment"
          className="flex items-center gap-2 font-data text-xs font-bold uppercase text-[#0D0D0D]"
        >
          <Upload className="w-4 h-4 text-[#9E1B1B]" />
          5. Unggah Dokumen Pendukung (Opsional — PDF, PNG, JPG, TXT, CSV, Maks. 10 MB)
        </label>
        <input
          id="attachment"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-xs font-data file:mr-3 file:px-3 file:py-1.5 file:border file:border-[#141414] file:bg-[#141414] file:text-white file:cursor-pointer"
        />
        <p className="text-[11px] text-[#5F5B53]">
          Lampiran disimpan di direktori terisolasi di luar folder publik dan
          hanya dapat diakses oleh editor terautentikasi. Hapus metadata
          penulis/EXIF file sebelum mengunggah jika informasi berisiko tinggi.
        </p>
      </div>

      {/* Mandatory Data Minimization & Honest Security Acknowledgement */}
      <label className="flex items-start gap-3 p-4 bg-[#FAF0F0] border border-[#9E1B1B] cursor-pointer">
        <input
          type="checkbox"
          checked={acknowledgedWarning}
          onChange={(e) => setAcknowledgedWarning(e.target.checked)}
          className="mt-1"
        />
        <span className="text-xs text-[#1F1E1C] leading-relaxed">
          Saya memahami bahwa situs web ini berjalan di infrastruktur web standar
          dan <strong>tidak menjamin anonimitas absolut di tingkat jaringan</strong>.
          Saya juga telah memastikan tidak menyertakan data pribadi yang tidak
          relevan (seperti nomor KTP, rekening pribadi, atau alamat keluarga) serta
          memahami bahwa seluruh laporan wajib melalui verifikasi redaksi sebelum
          publikasi.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#9E1B1B] hover:bg-[#781111] disabled:opacity-60 text-white font-data text-xs font-bold uppercase tracking-widest transition-colors"
      >
        <ShieldAlert className="w-4 h-4" />
        {submitting ? "Memproses & Memvalidasi..." : "Kirim Laporan ke Meja Verifikasi"}
      </button>
    </form>
  );
}
