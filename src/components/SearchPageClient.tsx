"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Newspaper,
  Users,
  FileText,
  Clock,
  HelpCircle,
  Scale,
} from "lucide-react";
import type {
  ArticleRecord,
  DocumentRecord,
  EntityRecord,
  RightOfReplyRecord,
  TimelineEventRecord,
  UnansweredQuestionRecord,
} from "@/types/domain";
import { StatusBadge } from "./StatusBadge";
import { formatIndonesianDate } from "@/lib/format";

interface SearchPageClientProps {
  articles: ArticleRecord[];
  entities: EntityRecord[];
  documents: DocumentRecord[];
  timeline: TimelineEventRecord[];
  questions: UnansweredQuestionRecord[];
  replies: RightOfReplyRecord[];
}

export function SearchPageClient({
  articles,
  entities,
  documents,
  timeline,
  questions,
  replies,
}: SearchPageClientProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q");
    const initialType = params.get("type");
    if (initialQ) setQuery(initialQ);
    if (initialType) setType(initialType);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        articles: [] as ArticleRecord[],
        entities: [] as EntityRecord[],
        documents: [] as DocumentRecord[],
        timeline: [] as TimelineEventRecord[],
        questions: [] as UnansweredQuestionRecord[],
        replies: [] as RightOfReplyRecord[],
      };
    }
    const want = (k: string) => type === "all" || type === k;
    return {
      articles: want("articles")
        ? articles.filter((a) =>
            `${a.title} ${a.subtitle} ${a.excerpt} ${JSON.stringify(a.body_sections)}`
              .toLowerCase()
              .includes(q)
          )
        : [],
      entities: want("entities")
        ? entities.filter((e) =>
            `${e.name} ${e.current_role} ${e.organization || ""} ${e.sector} ${e.summary}`
              .toLowerCase()
              .includes(q)
          )
        : [],
      documents: want("documents")
        ? documents.filter((d) =>
            `${d.title} ${d.doc_number} ${d.issuer} ${d.summary} ${JSON.stringify(d.key_citations)} ${JSON.stringify(d.pages_text)}`
              .toLowerCase()
              .includes(q)
          )
        : [],
      timeline: want("timeline")
        ? timeline.filter((t) =>
            `${t.title} ${t.summary} ${t.impact_analysis}`
              .toLowerCase()
              .includes(q)
          )
        : [],
      questions: want("questions")
        ? questions.filter((item) =>
            `${item.question} ${item.context} ${item.addressed_to}`
              .toLowerCase()
              .includes(q)
          )
        : [],
      replies: want("replies")
        ? replies.filter((r) =>
            `${r.topic} ${r.respondent_name} ${r.official_response_text} ${r.editorial_claim_summary}`
              .toLowerCase()
              .includes(q)
          )
        : [],
    };
  }, [query, type, articles, entities, documents, timeline, questions, replies]);

  const total =
    results.articles.length +
    results.entities.length +
    results.documents.length +
    results.timeline.length +
    results.questions.length +
    results.replies.length;

  const tabs = [
    { key: "all", label: "Semua Arsip" },
    { key: "articles", label: "Investigasi" },
    { key: "entities", label: "Database Entitas" },
    { key: "documents", label: "Dokumen PDF" },
    { key: "timeline", label: "Timeline" },
    { key: "questions", label: "Pertanyaan Terbuka" },
    { key: "replies", label: "Hak Jawab" },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-[#141414] p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 border border-[#141414] bg-[#F7F6F2] px-3 py-2">
            <Search className="w-4 h-4 text-[#9E1B1B]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan nama pejabat, BUMN, nomor UU/PP, angka transaksi, atau frasa kutipan..."
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="px-5 py-2.5 bg-[#141414] text-white font-data text-xs font-bold uppercase tracking-wider"
            >
              Bersihkan
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`px-3 py-1 font-data text-xs border ${
                type === t.key
                  ? "bg-[#141414] text-white border-[#141414] font-bold"
                  : "bg-[#F7F6F2] text-[#0D0D0D] border-[#D6D1C6] hover:border-[#141414]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!query.trim() ? (
        <div className="bg-white border border-[#D6D1C6] p-8 text-center space-y-3">
          <p className="font-editorial text-xl font-bold">
            Ketik kata kunci untuk memindai seluruh database investigasi.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Pasal 3H",
              "US$900 miliar",
              "PT BKI",
              "Rosan Roeslani",
              "Bank Mandiri",
              "Mahkamah Konstitusi",
              "dividen",
            ].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 border border-[#141414] bg-[#F7F6F2] hover:bg-[#9E1B1B] hover:text-white font-data text-xs transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <div className="bg-white border border-[#D6D1C6] p-10 text-center">
          <p className="font-editorial text-2xl font-bold">
            Tidak ada arsip yang cocok untuk &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <p className="font-data text-xs uppercase tracking-wider text-[#5F5B53]">
            Ditemukan <strong className="text-[#0D0D0D]">{total}</strong> hasil
            untuk &ldquo;{query}&rdquo;
          </p>

          {results.articles.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
                <Newspaper className="w-4 h-4" />
                Laporan Investigasi ({results.articles.length})
              </h2>
              <div className="divide-y divide-[#D6D1C6] border border-[#141414] bg-white">
                {results.articles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/investigasi/${a.slug}`}
                    className="block p-4 hover:bg-[#FAF0F0]/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={a.verification_status} />
                      <span className="font-data text-xs text-[#5F5B53]">
                        {formatIndonesianDate(a.published_at)}
                      </span>
                    </div>
                    <h3 className="font-editorial text-xl font-bold text-[#0D0D0D]">
                      {a.title}
                    </h3>
                    <p className="text-sm text-[#3F3D39] mt-1">{a.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.entities.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#163A5F]">
                <Users className="w-4 h-4" />
                Database Entitas ({results.entities.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {results.entities.map((e) => (
                  <Link
                    key={e.id}
                    href={`/database/${e.slug}`}
                    className="bg-white border border-[#141414] p-4 hover:border-[#9E1B1B]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-data text-[10px] font-bold px-2 py-0.5 bg-[#141414] text-white">
                        {e.entity_type}
                      </span>
                      <StatusBadge status={e.verification_status} />
                    </div>
                    <h3 className="font-editorial text-lg font-bold text-[#0D0D0D]">
                      {e.name}
                    </h3>
                    <p className="text-xs text-[#5F5B53] mt-0.5">
                      {e.current_role}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.documents.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#0D0D0D]">
                <FileText className="w-4 h-4" />
                Dokumen Terbuka &amp; PDF ({results.documents.length})
              </h2>
              <div className="divide-y divide-[#D6D1C6] border border-[#141414] bg-white">
                {results.documents.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dokumen/${d.id}`}
                    className="block p-4 hover:bg-[#EFECE6]"
                  >
                    <p className="font-data text-xs font-bold text-[#9E1B1B]">
                      {d.doc_number} • {d.page_count} HLM PDF
                    </p>
                    <h3 className="font-semibold text-base text-[#0D0D0D] mt-0.5">
                      {d.title}
                    </h3>
                    <p className="text-xs text-[#3F3D39] mt-1">{d.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.timeline.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
                <Clock className="w-4 h-4" />
                Peristiwa Timeline ({results.timeline.length})
              </h2>
              <div className="divide-y divide-[#D6D1C6] border border-[#141414] bg-white">
                {results.timeline.map((t) => (
                  <Link
                    key={t.id}
                    href="/timeline"
                    className="block p-4 hover:bg-[#FAF9F6]"
                  >
                    <span className="font-data text-xs font-bold text-[#9E1B1B]">
                      {t.display_date}
                    </span>
                    <h3 className="font-semibold text-base text-[#0D0D0D] mt-0.5">
                      {t.title}
                    </h3>
                    <p className="text-xs text-[#3F3D39] mt-1">{t.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.questions.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
                <HelpCircle className="w-4 h-4" />
                Pertanyaan Terbuka ({results.questions.length})
              </h2>
              <div className="space-y-2">
                {results.questions.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-[#141414] border-l-4 border-l-[#9E1B1B]"
                  >
                    <p className="font-data text-xs font-bold text-[#9E1B1B]">
                      {item.code} — {item.status}
                    </p>
                    <p className="font-semibold text-sm text-[#0D0D0D] mt-1">
                      {item.question}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.replies.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#581C87]">
                <Scale className="w-4 h-4" />
                Hak Jawab &amp; Bantahan ({results.replies.length})
              </h2>
              <div className="space-y-2">
                {results.replies.map((r) => (
                  <Link
                    key={r.id}
                    href="/hak-jawab"
                    className="block p-4 bg-white border border-[#581C87]"
                  >
                    <p className="font-data text-xs font-bold text-[#581C87]">
                      {r.respondent_name}
                    </p>
                    <p className="font-semibold text-sm text-[#0D0D0D] mt-0.5">
                      {r.topic}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
