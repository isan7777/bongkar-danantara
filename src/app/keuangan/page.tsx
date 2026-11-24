import type { Metadata } from "next";
import Link from "next/link";
import { Download, BarChart3, GitCompare } from "lucide-react";
import { listFinancialRecords } from "@/lib/db/queries";
import { FinancialCharts } from "@/components/FinancialCharts";
import { formatTrillionIdr } from "@/lib/format";
import { IS_STATIC_EXPORT, withBasePath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Visualisasi & Analisis Data Keuangan Danantara",
  description:
    "Bedah interaktif total aset, laba bersih, dividen 7 BUMN awal Danantara, perbandingan klaim AUM US$900 miliar terhadap neraca nyata, dan unduh dataset CSV.",
};

export default function KeuanganPage() {
  const records = listFinancialRecords();
  const fy2024 = records.filter((r) => r.fiscal_year === 2024);

  const totalAssets2024 = fy2024.reduce((acc, r) => acc + r.total_assets_idr_t, 0);
  const bankAssets2024 = fy2024
    .filter((r) => r.sector === "Perbankan")
    .reduce((acc, r) => acc + r.total_assets_idr_t, 0);
  const totalProfit2024 = fy2024.reduce((acc, r) => acc + r.net_profit_idr_t, 0);
  const totalDividend2024 = fy2024.reduce((acc, r) => acc + r.dividend_idr_t, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-2 border-[#141414] pb-5">
        <div>
          <div className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
            <BarChart3 className="w-4 h-4" />
            DESK DATA &amp; AKUNTANSI FORENSIK
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] mt-1">
            Visualisasi Data Keuangan Danantara
          </h1>
          <p className="mt-2 text-base text-[#3F3D39] max-w-3xl">
            Membedah struktur aset bruto, porsi Dana Pihak Ketiga perbankan, laba
            bersih antarperiode, serta konsentrasi setoran dividen dari tujuh BUMN
            inti fondasi Danantara.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={
              IS_STATIC_EXPORT
                ? withBasePath("/static-data/keuangan-all.csv")
                : "/api/financials?format=csv"
            }
            download="bongkar-danantara-keuangan-all.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Dataset CSV
          </a>
          <Link
            href="/dokumen/bandingkan"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#141414] bg-white hover:bg-[#EFECE6] font-data text-xs font-bold uppercase tracking-wider"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Bandingkan 2023 vs 2024
          </Link>
        </div>
      </header>

      {/* Top KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-[#141414] p-5">
          <p className="font-data text-[10px] font-bold uppercase tracking-wider text-[#5F5B53]">
            TOTAL ASET BRUTO 7 BUMN (FY 2024)
          </p>
          <p className="font-data text-2xl sm:text-3xl font-bold text-[#0D0D0D] mt-1.5">
            {formatTrillionIdr(totalAssets2024)}
          </p>
          <p className="text-xs text-[#3F3D39] mt-1">
            Terpaut &gt;Rp5.300 T dari klaim publik AUM ~US$900 miliar.
          </p>
        </div>

        <div className="bg-white border-2 border-[#9E1B1B] p-5">
          <p className="font-data text-[10px] font-bold uppercase tracking-wider text-[#9E1B1B]">
            PORSI 3 BANK HIMBARA (59,3%)
          </p>
          <p className="font-data text-2xl sm:text-3xl font-bold text-[#9E1B1B] mt-1.5">
            {formatTrillionIdr(bankAssets2024)}
          </p>
          <p className="text-xs text-[#3F3D39] mt-1">
            Mayoritas berupa simpanan nasabah (DPK), bukan dana investasi bebas.
          </p>
        </div>

        <div className="bg-white border border-[#141414] p-5">
          <p className="font-data text-[10px] font-bold uppercase tracking-wider text-[#5F5B53]">
            TOTAL LABA BERSIH 7 BUMN (2024)
          </p>
          <p className="font-data text-2xl sm:text-3xl font-bold text-[#0D0D0D] mt-1.5">
            {formatTrillionIdr(totalProfit2024)}
          </p>
          <p className="text-xs text-[#3F3D39] mt-1">
            Mencakup prognosa operasional Pertamina ~Rp45,5 T.
          </p>
        </div>

        <div className="bg-[#141414] text-white p-5 border-b-4 border-[#9E1B1B]">
          <p className="font-data text-[10px] font-bold uppercase tracking-wider text-[#FCA5A5]">
            DIVIDEN 7 BUMN 2024 (95,6% NASIONAL)
          </p>
          <p className="font-data text-2xl sm:text-3xl font-bold text-white mt-1.5">
            {formatTrillionIdr(totalDividend2024)}
          </p>
          <p className="text-xs text-[#C7C2B6] mt-1">
            Dari total Rp85,5 T realisasi dividen seluruh BUMN 2024.
          </p>
        </div>
      </section>

      {/* Interactive Recharts Suite */}
      <FinancialCharts records={records} />

      {/* Complete Auditable Financial Table */}
      <section className="space-y-4">
        <div className="border-b-2 border-[#141414] pb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
              TABEL NERACA &amp; DIVIDEN LENGKAP (FY 2024)
            </p>
            <h2 className="font-editorial text-2xl font-extrabold text-[#0D0D0D]">
              Rincian Per Entitas 7 BUMN Fondasi Danantara
            </h2>
          </div>
          <Link
            href="/dokumen/DOC-BUMN-FIN-2024"
            className="font-data text-xs font-bold text-[#163A5F] hover:underline"
          >
            Buka Arsip Sumber DOC-BUMN-FIN-2024 →
          </Link>
        </div>

        <div className="bg-white border-2 border-[#141414] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-white font-data text-[11px] uppercase">
                <th className="p-3">Entitas BUMN</th>
                <th className="p-3">Sektor</th>
                <th className="p-3">Total Aset</th>
                <th className="p-3">Liabilitas / DPK</th>
                <th className="p-3">Ekuitas</th>
                <th className="p-3">Laba Bersih</th>
                <th className="p-3">Dividen 2024</th>
                <th className="p-3">Saham Negara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D1C6] font-data text-xs">
              {fy2024.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF9F6]">
                  <td className="p-3 font-sans">
                    <Link
                      href={`/database/${r.entity_slug}`}
                      className="font-bold text-sm text-[#0D0D0D] hover:text-[#9E1B1B]"
                    >
                      {r.entity_name}
                    </Link>
                    {r.ticker && (
                      <span className="ml-1.5 font-data text-[10px] px-1.5 py-0.5 bg-[#EFECE6] text-[#3F3D39]">
                        {r.ticker}
                      </span>
                    )}
                    <p className="text-[11px] text-[#5F5B53] mt-0.5">{r.notes}</p>
                  </td>
                  <td className="p-3 whitespace-nowrap">{r.sector}</td>
                  <td className="p-3 font-bold whitespace-nowrap">
                    {formatTrillionIdr(r.total_assets_idr_t)}
                  </td>
                  <td className="p-3 text-[#5F5B53] whitespace-nowrap">
                    {formatTrillionIdr(r.customer_deposits_or_liabilities_idr_t)}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {formatTrillionIdr(r.equity_idr_t)}
                  </td>
                  <td className="p-3 font-semibold whitespace-nowrap">
                    {formatTrillionIdr(r.net_profit_idr_t)}
                  </td>
                  <td className="p-3 font-bold text-[#9E1B1B] whitespace-nowrap">
                    {formatTrillionIdr(r.dividend_idr_t)}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {r.state_ownership_pct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
