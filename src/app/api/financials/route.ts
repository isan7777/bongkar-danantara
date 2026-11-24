import { NextResponse } from "next/server";
import { listFinancialRecords } from "@/lib/db/queries";

function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const format = searchParams.get("format");
  const year = yearParam ? Number(yearParam) : undefined;

  const records = listFinancialRecords(year);

  if (format === "csv") {
    const header = [
      "ID",
      "Entitas",
      "Ticker",
      "Sektor",
      "Tahun Buku",
      "Total Aset (Rp T)",
      "Laba Bersih (Rp T)",
      "Dividen (Rp T)",
      "Ekuitas (Rp T)",
      "Liabilitas/DPK (Rp T)",
      "Kepemilikan Negara (%)",
      "Status Data",
      "Catatan",
    ].join(",");

    const lines = records.map((r) =>
      [
        r.id,
        r.entity_name,
        r.ticker ?? "",
        r.sector,
        r.fiscal_year,
        r.total_assets_idr_t,
        r.net_profit_idr_t,
        r.dividend_idr_t,
        r.equity_idr_t ?? "",
        r.customer_deposits_or_liabilities_idr_t ?? "",
        r.state_ownership_pct,
        r.data_status,
        r.notes,
      ]
        .map(csvEscape)
        .join(",")
    );

    const csv = [header, ...lines].join("\r\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bongkar-danantara-keuangan-${year || "all"}.csv"`,
      },
    });
  }

  return NextResponse.json({ records, total: records.length });
}
