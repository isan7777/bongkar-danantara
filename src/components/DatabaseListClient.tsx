"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DocumentRecord, EntityRecord } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";
import { formatTrillionIdr } from "@/lib/format";

interface DatabaseListClientProps {
  entities: EntityRecord[];
  sectors: string[];
  years: number[];
  documents: DocumentRecord[];
  entityDocMap: Record<string, string[]>;
}

export function DatabaseListClient({
  entities,
  sectors,
  years,
  documents,
  entityDocMap,
}: DatabaseListClientProps) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [sector, setSector] = useState("");
  const [year, setYear] = useState("");
  const [minValue, setMinValue] = useState("");
  const [docId, setDocId] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const minValNum = minValue ? Number(minValue) : undefined;
    const yearNum = year ? Number(year) : undefined;

    return entities.filter((e) => {
      if (type && e.entity_type !== type) return false;
      if (sector && e.sector !== sector) return false;
      if (yearNum && e.year_active !== yearNum) return false;
      if (
        minValNum !== undefined &&
        !Number.isNaN(minValNum) &&
        (e.transaction_value_idr_t ?? 0) < minValNum
      ) {
        return false;
      }
      if (docId) {
        const linked = entityDocMap[e.id] || [];
        if (!linked.includes(docId)) return false;
      }
      if (query) {
        const hay =
          `${e.name} ${e.current_role} ${e.organization || ""} ${e.sector} ${e.summary}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [entities, q, type, sector, year, minValue, docId, entityDocMap]);

  const typeCounts = {
    INDIVIDU: filtered.filter((e) => e.entity_type === "INDIVIDU").length,
    PERUSAHAAN: filtered.filter((e) => e.entity_type === "PERUSAHAAN").length,
    LEMBAGA: filtered.filter((e) => e.entity_type === "LEMBAGA").length,
    PROYEK: filtered.filter((e) => e.entity_type === "PROYEK").length,
  };

  const hasFilter = Boolean(q || type || sector || year || minValue || docId);

  function resetAll() {
    setQ("");
    setType("");
    setSector("");
    setYear("");
    setMinValue("");
    setDocId("");
  }

  return (
    <>
      <div className="bg-white border-2 border-[#141414] p-5 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label
              htmlFor="db-q"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Nama Individu / Perusahaan / Jabatan / Proyek
            </label>
            <input
              id="db-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Contoh: Rosan, Bank Mandiri, CEO, BKI, Hilirisasi..."
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="db-type"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Jenis Entitas
            </label>
            <select
              id="db-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            >
              <option value="">Semua Jenis</option>
              <option value="INDIVIDU">Individu (Pejabat / Eksekutif)</option>
              <option value="PERUSAHAAN">Perusahaan / BUMN</option>
              <option value="LEMBAGA">Lembaga / Dewan</option>
              <option value="PROYEK">Proyek / Skema Investasi</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="db-sector"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Sektor Industri
            </label>
            <select
              id="db-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            >
              <option value="">Semua Sektor</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <label
              htmlFor="db-minValue"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Nilai Aset / Transaksi Minimal (Rp T)
            </label>
            <input
              id="db-minValue"
              type="number"
              step="10"
              min="0"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="Misal: 300 atau 1000"
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="db-year"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Tahun Tercatat
            </label>
            <select
              id="db-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
            >
              <option value="">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="db-docId"
              className="block font-data text-[11px] font-bold uppercase text-[#5F5B53] mb-1"
            >
              Dokumen Sumber Terkait
            </label>
            <select
              id="db-docId"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            >
              <option value="">Semua Dokumen Sumber</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.doc_number} ({d.id})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            {hasFilter ? (
              <button
                type="button"
                onClick={resetAll}
                className="w-full px-4 py-2 bg-[#9E1B1B] hover:bg-[#781111] text-white font-data text-xs font-bold uppercase tracking-wider"
              >
                Reset Filter ({filtered.length})
              </button>
            ) : (
              <div className="w-full px-4 py-2 bg-[#EFECE6] text-center font-data text-xs text-[#5F5B53]">
                Pencarian Real-Time
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 font-data text-xs">
        <span className="font-bold uppercase text-[#0D0D0D]">
          Ditemukan {filtered.length} Entitas Terdokumentasi
        </span>
        <div className="flex flex-wrap gap-3 text-[#5F5B53]">
          <span>Individu: {typeCounts.INDIVIDU}</span>
          <span>•</span>
          <span>Perusahaan/BUMN: {typeCounts.PERUSAHAAN}</span>
          <span>•</span>
          <span>Lembaga: {typeCounts.LEMBAGA}</span>
          <span>•</span>
          <span>Proyek: {typeCounts.PROYEK}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#D6D1C6] p-10 text-center">
          <p className="font-editorial text-xl font-bold">
            Tidak ada entitas yang memenuhi kriteria filter Anda.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-3 font-data text-xs font-bold text-[#9E1B1B] underline"
          >
            Reset seluruh filter database
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ent) => (
            <Link
              key={ent.id}
              href={`/database/${ent.slug}`}
              className="group bg-white border border-[#141414] hover:border-[#9E1B1B] p-5 flex flex-col justify-between transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-data text-[10px] font-bold uppercase px-2 py-0.5 bg-[#141414] text-white">
                    {ent.entity_type}
                  </span>
                  <StatusBadge status={ent.verification_status} />
                </div>

                <h2 className="font-editorial text-xl font-extrabold text-[#0D0D0D] group-hover:text-[#9E1B1B] leading-snug">
                  {ent.name}
                </h2>

                <p className="text-xs font-semibold text-[#163A5F]">
                  {ent.current_role}
                </p>

                <p className="text-sm text-[#3F3D39] leading-relaxed line-clamp-3">
                  {ent.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EFECE6] space-y-2 font-data text-[11px]">
                <div className="flex items-center justify-between text-[#5F5B53]">
                  <span>Sektor: {ent.sector}</span>
                  <span>Tahun: {ent.year_active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0D0D0D]">
                    Skala: {formatTrillionIdr(ent.transaction_value_idr_t)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#9E1B1B] group-hover:underline">
                    Buka Profil
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
