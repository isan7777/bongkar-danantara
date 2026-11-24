"use client";

import { useState } from "react";
import { Search, ShieldCheck, AlertTriangle } from "lucide-react";
import type { ModerationStatus } from "@/types/domain";
import { formatIndonesianDate, getModerationStatusLabel } from "@/lib/format";
import { IS_STATIC_EXPORT } from "@/lib/paths";

interface StatusResult {
  tracking_code: string;
  category: string;
  title: string;
  risk_level: string;
  moderation_status: ModerationStatus;
  editor_public_note: string | null;
  attachment_original_name: string | null;
  attachment_sha256: string | null;
  created_at: string;
  updated_at: string;
}

export function ReportStatusCheckerClient() {
  const [trackingCode, setTrackingCode] = useState("");
  const [accessPin, setAccessPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      if (IS_STATIC_EXPORT) {
        const codeUpper = trackingCode.trim().toUpperCase();
        const pinUpper = accessPin.trim().toUpperCase();
        const localItems = JSON.parse(
          localStorage.getItem("bd_static_reports") || "[]"
        ) as Array<StatusResult & { access_pin: string }>;
        const demoItem: StatusResult & { access_pin: string } = {
          tracking_code: "BD-2026-4102-DEMO",
          access_pin: "VERI-2026",
          category: "Transparansi Proyek & Pengadaan",
          title:
            "[CONTOH ANTREAN VERIFIKASI] Permintaan Penelusuran Dokumen Tender Konsultan Valuasi",
          risk_level: "SEDANG",
          moderation_status: "VERIFIKASI_AWAL",
          editor_public_note:
            "Laporan telah diterima meja verifikasi redaksi. Tim sedang melakukan pemeriksaan kecocokan dokumen publik.",
          attachment_original_name: null,
          attachment_sha256: null,
          created_at: "2026-11-20T10:15:00Z",
          updated_at: "2026-11-20T10:15:00Z",
        };
        const match = [demoItem, ...localItems].find(
          (item) =>
            item.tracking_code.toUpperCase() === codeUpper &&
            item.access_pin.toUpperCase() === pinUpper
        );
        if (!match) {
          setError("Kode pelacakan atau PIN tidak cocok.");
          return;
        }
        setResult(match);
        return;
      }

      const res = await fetch("/api/reports/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_code: trackingCode.trim(),
          access_pin: accessPin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Laporan tidak ditemukan.");
        return;
      }
      setResult(data.report as StatusResult);
    } catch {
      setError("Gagal menghubungi server pemeriksaan status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleLookup}
        className="bg-white border-2 border-[#141414] p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="code"
              className="block font-data text-xs font-bold uppercase text-[#0D0D0D] mb-1"
            >
              Kode Pelacakan Laporan
            </label>
            <input
              id="code"
              type="text"
              required
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Contoh: BD-2026-4102-DEMO"
              className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] font-data text-sm uppercase"
            />
          </div>
          <div>
            <label
              htmlFor="pin"
              className="block font-data text-xs font-bold uppercase text-[#0D0D0D] mb-1"
            >
              PIN Akses Pelapor
            </label>
            <input
              id="pin"
              type="password"
              required
              value={accessPin}
              onChange={(e) => setAccessPin(e.target.value)}
              placeholder="Contoh: XXXX-XXXX"
              className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] font-data text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          {loading ? "Memeriksa..." : "Periksa Status Moderasi"}
        </button>
      </form>

      {error && (
        <div className="bg-[#FAF0F0] border border-[#9E1B1B] p-4 text-sm text-[#781111] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-white border-2 border-[#141414] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6D1C6] pb-3">
            <div className="flex items-center gap-2 font-data text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-[#163A5F]" />
              <span>{result.tracking_code}</span>
            </div>
            <span
              className={`font-data text-xs font-bold px-2.5 py-1 border ${
                getModerationStatusLabel(result.moderation_status).style
              }`}
            >
              {getModerationStatusLabel(result.moderation_status).label}
            </span>
          </div>

          <h2 className="font-editorial text-2xl font-bold text-[#0D0D0D]">
            {result.title}
          </h2>

          <div className="grid sm:grid-cols-3 gap-3 font-data text-xs text-[#5F5B53]">
            <div>Kategori: {result.category}</div>
            <div>Diterima: {formatIndonesianDate(result.created_at)}</div>
            <div>Diperbarui: {formatIndonesianDate(result.updated_at)}</div>
          </div>

          {result.editor_public_note && (
            <div className="bg-[#FAF9F6] border-l-4 border-[#163A5F] p-4 space-y-1">
              <p className="font-data text-[11px] font-bold uppercase text-[#163A5F]">
                CATATAN TERBARU DARI MEJA VERIFIKASI REDAKSI
              </p>
              <p className="text-sm text-[#1F1E1C] leading-relaxed">
                {result.editor_public_note}
              </p>
            </div>
          )}

          {result.attachment_original_name && (
            <div className="font-data text-xs text-[#5F5B53] border-t border-[#EFECE6] pt-3">
              Lampiran tercatat: <strong>{result.attachment_original_name}</strong>{" "}
              (SHA-256: {result.attachment_sha256?.slice(0, 20)}...)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
