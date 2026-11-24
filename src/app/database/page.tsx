import type { Metadata } from "next";
import { Database, ShieldCheck } from "lucide-react";
import {
  listDocuments,
  listEntities,
  listEntityDocumentMap,
  listEntityFacets,
} from "@/lib/db/queries";
import { DatabaseListClient } from "@/components/DatabaseListClient";

export const metadata: Metadata = {
  title: "Database Investigasi Entitas, Pejabat & Perusahaan",
  description:
    "Telusuri profil individu, direksi, pengawas, BUMN, lembaga, dan proyek investasi Danantara berdasarkan jabatan, sektor, nilai transaksi, tahun, dan dokumen sumber.",
};

export default function DatabasePage() {
  const facets = listEntityFacets();
  const documents = listDocuments();
  const entities = listEntities();
  const entityDocMap = listEntityDocumentMap();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="border-b-2 border-[#141414] pb-5 mb-6">
        <div className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
          <Database className="w-4 h-4" />
          DATABASE INVESTIGASI INTERAKTIF
        </div>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] mt-1">
          Entitas, Pejabat, BUMN &amp; Proyek Danantara
        </h1>
        <p className="mt-2 text-base text-[#3F3D39] max-w-3xl">
          Cari dan saring individu, perusahaan, lembaga negara, serta skema
          investasi berdasarkan nama, jabatan, nilai aset/transaksi, tahun, sektor
          industri, dan dokumen sumber primer.
        </p>
      </div>

      <div className="bg-[#EFECE6] border border-[#141414] border-l-4 border-l-[#163A5F] p-4 mb-7 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#163A5F] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#1F1E1C] leading-relaxed">
          <strong className="font-semibold">Prinsip Pencatatan Database:</strong>{" "}
          Database ini memetakan jabatan resmi, struktur kepemilikan, nilai
          aset/transaksi, dan relasi profesional berdasarkan dokumen publik yang
          dapat diverifikasi. Pencantuman seseorang atau perusahaan maupun hubungan
          struktural biasa <strong>bukan merupakan bukti atau tuduhan kejahatan</strong>.
        </p>
      </div>

      <DatabaseListClient
        entities={entities}
        sectors={facets.sectors}
        years={facets.years}
        documents={documents}
        entityDocMap={entityDocMap}
      />
    </div>
  );
}
