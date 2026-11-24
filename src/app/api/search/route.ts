import { NextResponse } from "next/server";
import { globalSearch } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").slice(0, 140);
  const type = searchParams.get("type") || "all";

  const results = globalSearch(q, type);
  const total =
    results.articles.length +
    results.entities.length +
    results.documents.length +
    results.timeline.length +
    results.questions.length +
    results.replies.length;

  return NextResponse.json({ query: q, total, results });
}
