"use client";

import { useState } from "react";
import { Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { IS_STATIC_EXPORT } from "@/lib/paths";

interface RightOfReplyFormClientProps {
  articleOptions: Array<{ slug: string; title: string }>;
}

export function RightOfReplyFormClient({
  articleOptions,
}: RightOfReplyFormClientProps) {
  const [respondentName, setRespondentName] = useState("");
  const [respondentRole, setRespondentRole] = useState("");
  const [relatedSlug, setRelatedSlug] = useState("");
  const [topic, setTopic] = useState("");
  const [claimSummary, setClaimSummary] = useState("");
  const [responseText, setResponseText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (IS_STATIC_EXPORT) {
        const fakeId = `ROR-STATIC-${Math.floor(100 + Math.random() * 900)}`;
        setSuccessId(`${fakeId} (Mode Pratinjau Statis GitHub Pages)`);
        setRespondentName("");
        setRespondentRole("");
        setTopic("");
        setClaimSummary("");
        setResponseText("");
        setSourceUrl("");
        return;
      }

      const res = await fetch("/api/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondent_name: respondentName,
          respondent_role: respondentRole,
          related_article_slug: relatedSlug || null,
          topic,
          editorial_claim_summary: claimSummary,
          official_response_text: responseText,
          source_url: sourceUrl || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim hak jawab.");
        return;
      }
      setSuccessId(data.id);
      setRespondentName("");
      setRespondentRole("");
      setTopic("");
      setClaimSummary("");
      setResponseText("");
      setSourceUrl("");
    } catch {
      setError("Terjadi gangguan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="ajukan-hak-jawab"
      className="bg-white border-2 border-[#141414] p-6 sm:p-8 space-y-5"
    >
      <div className="border-b border-[#D6D1C6] pb-3">
        <div className="flex items-center gap-2 text-[#581C87] font-data text-xs font-bold uppercase tracking-widest">
          <Scale className="w-4 h-4" />
          FORMULIR RESMI HAK JAWAB &amp; PERMINTAAN KOREKSI
        </div>
        <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D] mt-1">
          Sampaikan Tanggapan Resmi Danantara atau Pihak Terkait
        </h2>
        <p className="text-sm text-[#3F3D39] mt-1">
          Tanggapan yang dikirim melalui formulir ini masuk ke antrean verifikasi
          keaslian pihak penanggap dan akan dipublikasikan secara utuh beserta
          catatan verifikasi redaksi.
        </p>
      </div>

      {successId && (
        <div className="bg-[#E6F4EA] border border-[#166534] p-4 text-sm text-[#14532D] flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>Hak Jawab tercatat ({successId}).</strong> Tanggapan Anda
            telah masuk antrean moderasi redaksi untuk verifikasi identitas
            penanggap dan penayangan utuh.
          </div>
        </div>
      )}

      {error && (
        <div className="bg-[#FAF0F0] border border-[#9E1B1B] p-4 text-sm text-[#781111] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ror-name"
              className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
            >
              Nama Pihak / Instansi Penanggap *
            </label>
            <input
              id="ror-name"
              type="text"
              required
              minLength={3}
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Contoh: Biro Hukum / Humas BPI Danantara"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="ror-role"
              className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
            >
              Jabatan / Kapasitas Resmi *
            </label>
            <input
              id="ror-role"
              type="text"
              required
              minLength={3}
              value={respondentRole}
              onChange={(e) => setRespondentRole(e.target.value)}
              placeholder="Contoh: Juru Bicara Resmi / Kuasa Hukum"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ror-article"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Artikel Terkait (Opsional)
            </label>
            <select
              id="ror-article"
              value={relatedSlug}
              onChange={(e) => setRelatedSlug(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            >
              <option value="">Umum / Lintas Artikel</option>
              {articleOptions.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ror-url"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Tautan Siaran Pers / Dokumen Resmi (Opsional)
            </label>
            <input
              id="ror-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="ror-topic"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            Pokok Bahasan Bantahan / Klarifikasi *
          </label>
          <input
            id="ror-topic"
            type="text"
            required
            minLength={8}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: Klarifikasi Valuasi Aset Konsolidasi Tahap Pertama"
            className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="ror-claim"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            Bagian Laporan yang Ditanggapi *
          </label>
          <textarea
            id="ror-claim"
            rows={2}
            required
            minLength={10}
            value={claimSummary}
            onChange={(e) => setClaimSummary(e.target.value)}
            placeholder="Sebutkan kutipan atau angka dalam laporan yang hendak diklarifikasi..."
            className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="ror-text"
            className="block font-data text-[11px] font-bold uppercase text-[#0D0D0D] mb-1"
          >
            Teks Lengkap Hak Jawab / Bantahan Resmi *
          </label>
          <textarea
            id="ror-text"
            rows={5}
            required
            minLength={20}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Tuliskan tanggapan lengkap beserta rujukan data atau dokumen pendukung..."
            className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-[#581C87] hover:bg-[#3B0764] disabled:opacity-60 text-white font-data text-xs font-bold uppercase tracking-wider transition-colors"
        >
          {submitting ? "Mengirim..." : "Kirim Hak Jawab ke Meja Redaksi"}
        </button>
      </form>
    </section>
  );
}
