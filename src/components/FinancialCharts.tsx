"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import type { FinancialRecord } from "@/types/domain";
import { formatTrillionIdr } from "@/lib/format";

interface FinancialChartsProps {
  records: FinancialRecord[];
  compact?: boolean;
}

const SHORT_NAMES: Record<string, string> = {
  "PT Bank Mandiri (Persero) Tbk": "Bank Mandiri",
  "PT Bank Rakyat Indonesia (Persero) Tbk": "BRI",
  "PT PLN (Persero)": "PLN",
  "PT Pertamina (Persero)": "Pertamina",
  "PT Bank Negara Indonesia (Persero) Tbk": "BNI",
  "PT Mineral Industri Indonesia (MIND ID)": "MIND ID",
  "PT Telkom Indonesia (Persero) Tbk": "Telkom",
};

export function FinancialCharts({
  records,
  compact = false,
}: FinancialChartsProps) {
  const [metric, setMetric] = useState<
    "total_assets_idr_t" | "net_profit_idr_t" | "dividend_idr_t"
  >("total_assets_idr_t");
  const [sectorFilter, setSectorFilter] = useState<string>("SEMUA");

  const sectors = useMemo(() => {
    const s = new Set(records.map((r) => r.sector));
    return ["SEMUA", ...Array.from(s)];
  }, [records]);

  const records2024 = useMemo(() => {
    return records
      .filter((r) => r.fiscal_year === 2024)
      .filter((r) => sectorFilter === "SEMUA" || r.sector === sectorFilter)
      .map((r) => ({
        ...r,
        shortName: SHORT_NAMES[r.entity_name] || r.entity_name,
        isBank: r.sector === "Perbankan",
      }))
      .sort((a, b) => Number(b[metric]) - Number(a[metric]));
  }, [records, metric, sectorFilter]);

  const yoyComparison = useMemo(() => {
    const bySlug = new Map<
      string,
      {
        shortName: string;
        profit2023: number;
        profit2024: number;
        dividend2023: number;
        dividend2024: number;
      }
    >();
    for (const r of records) {
      const entry = bySlug.get(r.entity_slug) || {
        shortName: SHORT_NAMES[r.entity_name] || r.entity_name,
        profit2023: 0,
        profit2024: 0,
        dividend2023: 0,
        dividend2024: 0,
      };
      if (r.fiscal_year === 2023) {
        entry.profit2023 = r.net_profit_idr_t;
        entry.dividend2023 = r.dividend_idr_t;
      } else if (r.fiscal_year === 2024) {
        entry.profit2024 = r.net_profit_idr_t;
        entry.dividend2024 = r.dividend_idr_t;
      }
      bySlug.set(r.entity_slug, entry);
    }
    return Array.from(bySlug.values()).sort(
      (a, b) => b.profit2024 - a.profit2024
    );
  }, [records]);

  const claimVsReality = [
    {
      label: "Klaim AUM (~US$900M)",
      nilai: 14700,
      color: "#57534E",
    },
    {
      label: "Aset Bruto 7 BUMN (FY24)",
      nilai: 9353.4,
      color: "#141414",
    },
    {
      label: "Porsi 3 Bank (Dominan DPK)",
      nilai: 5550.0,
      color: "#9E1B1B",
    },
    {
      label: "Modal Awal UU 1/2025",
      nilai: 1000.0,
      color: "#163A5F",
    },
    {
      label: "Efisiensi APBN Tahap Awal",
      nilai: 300.0,
      color: "#8C6D46",
    },
    {
      label: "Dividen 7 BUMN 2024",
      nilai: 81.7,
      color: "#166534",
    },
  ];

  const metricLabel =
    metric === "total_assets_idr_t"
      ? "Total Aset Bruto FY 2024 (Rp Triliun)"
      : metric === "net_profit_idr_t"
      ? "Laba Bersih FY 2024 (Rp Triliun)"
      : "Realisasi Setoran Dividen 2024 (Rp Triliun)";

  return (
    <div className="space-y-8">
      {/* Main Metric Chart */}
      <div className="bg-white border border-[#141414] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D6D1C6] pb-4 mb-5">
          <div>
            <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
              VISUALISASI DATA KEUANGAN 7 BUMN UTAMA
            </p>
            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#0D0D0D] mt-0.5">
              {metricLabel}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMetric("total_assets_idr_t")}
              className={`px-3 py-1.5 font-data text-xs border transition-colors ${
                metric === "total_assets_idr_t"
                  ? "bg-[#141414] text-white border-[#141414]"
                  : "bg-[#F7F6F2] text-[#0D0D0D] border-[#D6D1C6] hover:border-[#141414]"
              }`}
            >
              Total Aset
            </button>
            <button
              type="button"
              onClick={() => setMetric("net_profit_idr_t")}
              className={`px-3 py-1.5 font-data text-xs border transition-colors ${
                metric === "net_profit_idr_t"
                  ? "bg-[#141414] text-white border-[#141414]"
                  : "bg-[#F7F6F2] text-[#0D0D0D] border-[#D6D1C6] hover:border-[#141414]"
              }`}
            >
              Laba Bersih
            </button>
            <button
              type="button"
              onClick={() => setMetric("dividend_idr_t")}
              className={`px-3 py-1.5 font-data text-xs border transition-colors ${
                metric === "dividend_idr_t"
                  ? "bg-[#9E1B1B] text-white border-[#9E1B1B]"
                  : "bg-[#F7F6F2] text-[#0D0D0D] border-[#D6D1C6] hover:border-[#9E1B1B]"
              }`}
            >
              Dividen 2024
            </button>

            {!compact && (
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                aria-label="Filter sektor"
                className="px-2.5 py-1.5 font-data text-xs bg-white border border-[#141414] text-[#0D0D0D]"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    Sektor: {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={records2024}
              margin={{ top: 10, right: 20, left: 6, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: "#1F1E1C", fontFamily: "monospace" }}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#5F5B53", fontFamily: "monospace" }}
                tickFormatter={(v) => `Rp${v}T`}
              />
              <Tooltip
                formatter={(value: number) => [
                  formatTrillionIdr(Number(value)),
                  metric === "total_assets_idr_t"
                    ? "Total Aset"
                    : metric === "net_profit_idr_t"
                    ? "Laba Bersih"
                    : "Dividen 2024",
                ]}
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #9E1B1B",
                  color: "#F7F6F2",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#FCA5A5", fontWeight: 700, marginBottom: 4 }}
                itemStyle={{ color: "#F7F6F2" }}
              />
              <Bar dataKey={metric} radius={[0, 0, 0, 0]}>
                {records2024.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.isBank ? "#9E1B1B" : "#163A5F"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E5E1D8] flex flex-wrap items-center justify-between gap-2 text-xs font-data text-[#5F5B53]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#9E1B1B] inline-block" />
              Perbankan (Himbara — dominan Dana Pihak Ketiga)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#163A5F] inline-block" />
              Non-Bank (Energi, Tambang, Telko)
            </span>
          </div>
          <span>Sumber: Laporan Keuangan 7 BUMN FY 2024 & Rilis Kementerian BUMN</span>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 2: Claim vs Reality */}
          <div className="bg-white border border-[#141414] p-5 sm:p-6">
            <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#9E1B1B]">
              UJI KLAIM PUBLIK VS NERACA
            </p>
            <h3 className="font-editorial text-xl font-bold text-[#0D0D0D] mt-0.5 mb-4">
              Skala Klaim AUM vs Aset Bruto vs Kas Dividen (Rp Triliun)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={claimVsReality}
                  layout="vertical"
                  margin={{ top: 6, right: 24, left: 10, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#5F5B53", fontFamily: "monospace" }}
                    tickFormatter={(v) => `${v}T`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={165}
                    tick={{ fontSize: 10.5, fill: "#141414", fontFamily: "monospace" }}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatTrillionIdr(Number(v)), "Nilai"]}
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #9E1B1B",
                      color: "#F7F6F2",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#FCA5A5", fontWeight: 700, marginBottom: 4 }}
                    itemStyle={{ color: "#F7F6F2" }}
                  />
                  <Bar dataKey="nilai">
                    {claimVsReality.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-[#5F5B53] leading-relaxed">
              Perbandingan menunjukkan selisih lebar antara narasi AUM ~US$900 miliar
              dengan kapasitas arus kas aktual tahunan dari dividen BUMN sebesar Rp81,7 T.
            </p>
          </div>

          {/* Chart 3: YoY Net Profit 2023 vs 2024 */}
          <div className="bg-white border border-[#141414] p-5 sm:p-6">
            <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#163A5F]">
              PERBANDINGAN ANTARPERIODE
            </p>
            <h3 className="font-editorial text-xl font-bold text-[#0D0D0D] mt-0.5 mb-4">
              Laba Bersih 7 BUMN Utama: FY 2023 vs FY 2024 (Rp Triliun)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yoyComparison}
                  margin={{ top: 10, right: 16, left: 4, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 10.5, fill: "#141414", fontFamily: "monospace" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10.5, fill: "#5F5B53", fontFamily: "monospace" }}
                    tickFormatter={(v) => `${v}T`}
                  />
                  <Tooltip
                    formatter={(v: number) => formatTrillionIdr(Number(v))}
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #163A5F",
                      color: "#F7F6F2",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#E8E4DC", fontWeight: 700, marginBottom: 4 }}
                    itemStyle={{ color: "#F7F6F2" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                  <Bar dataKey="profit2023" name="Laba 2023" fill="#A6A197" />
                  <Bar dataKey="profit2024" name="Laba 2024" fill="#141414" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-[#5F5B53] leading-relaxed">
              MIND ID mencatat lonjakan laba +46% pada 2024, sementara Pertamina mengalami
              koreksi prognosa laba dari Rp66,11 T (2023) menjadi sekitar Rp45,50 T (2024).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
