"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Users, Newspaper, Clock, HelpCircle, Scale, ArrowRight } from "lucide-react";
import type {
  ArticleRecord,
  DocumentRecord,
  EntityRecord,
  RightOfReplyRecord,
  TimelineEventRecord,
  UnansweredQuestionRecord,
} from "@/types/domain";
import { StatusBadge } from "./StatusBadge";
import { IS_STATIC_EXPORT, withBasePath } from "@/lib/paths";

let staticArchiveCache: SearchResponse["results"] | null = null;

interface SearchResponse {
  query: string;
  total: number;
  results: {
    articles: ArticleRecord[];
    entities: EntityRecord[];
    documents: DocumentRecord[];
    timeline: TimelineEventRecord[];
    questions: UnansweredQuestionRecord[];
    replies: RightOfReplyRecord[];
  };
}

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (IS_STATIC_EXPORT) {
          if (!staticArchiveCache) {
            const res = await fetch(withBasePath("/static-data/archive.json"), {
              signal: controller.signal,
            });
            if (res.ok) {
              staticArchiveCache =
                (await res.json()) as SearchResponse["results"];
            }
          }
          if (staticArchiveCache) {
            const ql = trimmed.toLowerCase();
            const articles = staticArchiveCache.articles.filter((a) =>
              `${a.title} ${a.subtitle} ${a.excerpt}`.toLowerCase().includes(ql)
            );
            const entities = staticArchiveCache.entities.filter((e) =>
              `${e.name} ${e.current_role} ${e.sector} ${e.summary}`
                .toLowerCase()
                .includes(ql)
            );
            const documents = staticArchiveCache.documents.filter((d) =>
              `${d.title} ${d.doc_number} ${d.summary} ${JSON.stringify(d.key_citations)}`
                .toLowerCase()
                .includes(ql)
            );
            const timeline = staticArchiveCache.timeline.filter((t) =>
              `${t.title} ${t.summary}`.toLowerCase().includes(ql)
            );
            const questions = staticArchiveCache.questions.filter((item) =>
              `${item.question} ${item.context}`.toLowerCase().includes(ql)
            );
            const replies = staticArchiveCache.replies.filter((r) =>
              `${r.topic} ${r.respondent_name} ${r.official_response_text}`
                .toLowerCase()
                .includes(ql)
            );
            setData({
              query: trimmed,
              total:
                articles.length +
                entities.length +
                documents.length +
                timeline.length +
                questions.length +
                replies.length,
              results: {
                articles,
                entities,
                documents,
                timeline,
                questions,
                replies,
              },
            });
          }
          return;
        }

        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const json = (await res.json()) as SearchResponse;
          setData(json);
        }
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  function goToFullSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    onClose();
    router.push(trimmed ? `/cari?q=${encodeURIComponent(trimmed)}` : "/cari");
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-12 px-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian Global Bongkar Danantara"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#F7F6F2] border-2 border-[#141414] shadow-2xl mb-12"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={goToFullSearch}
          className="flex items-center border-b-2 border-[#141414] bg-white px-4 py-3 gap-3"
        >
          <Search className="w-5 h-5 text-[#9E1B1B] shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari artikel, nama pejabat, BUMN, nomor UU/PP, proyek Rp300 T, atau kutipan dokumen..."
            className="w-full bg-transparent text-base text-[#0D0D0D] placeholder:text-[#78716C] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5F5B53] hover:text-[#0D0D0D]"
            aria-label="Tutup pencarian"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {query.trim().length < 2 && (
            <div className="space-y-4">
              <p className="font-data text-xs uppercase tracking-wider text-[#5F5B53]">
                Kueri Pencarian Cepat yang Sering Diperiksa
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "US$900 miliar",
                  "Pasal 3H",
                  "Rosan Roeslani",
                  "PT BKI",
                  "dividen",
                  "UU No. 16",
                  "Ray Dalio",
                  "Mahkamah Konstitusi",
                  "Rp300 triliun",
                ].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 bg-white border border-[#D6D1C6] hover:border-[#9E1B1B] hover:text-[#9E1B1B] font-data text-xs transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <p className="font-data text-xs uppercase tracking-wider text-[#5F5B53] py-6 text-center">
              Memindai arsip artikel, database entitas, dan dokumen PDF...
            </p>
          )}

          {!loading && data && data.total === 0 && (
            <div className="py-8 text-center">
              <p className="font-editorial text-lg font-semibold text-[#0D0D0D]">
                Tidak ada arsip yang cocok untuk &ldquo;{data.query}&rdquo;
              </p>
              <p className="text-sm text-[#5F5B53] mt-1">
                Coba gunakan kata kunci nama entitas, nomor regulasi, atau sektor BUMN.
              </p>
            </div>
          )}

          {!loading && data && data.total > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#D6D1C6] pb-2">
                <span className="font-data text-xs uppercase tracking-wider text-[#5F5B53]">
                  Ditemukan {data.total} hasil lintas arsip
                </span>
                <button
                  type="button"
                  onClick={goToFullSearch}
                  className="inline-flex items-center gap-1 font-data text-xs font-semibold text-[#9E1B1B] hover:underline"
                >
                  Buka halaman hasil lengkap
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data.results.articles.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-wider text-[#9E1B1B] mb-2">
                    <Newspaper className="w-3.5 h-3.5" />
                    Laporan Investigasi ({data.results.articles.length})
                  </h3>
                  <div className="divide-y divide-[#D6D1C6] border border-[#D6D1C6] bg-white">
                    {data.results.articles.slice(0, 4).map((a) => (
                      <Link
                        key={a.id}
                        href={`/investigasi/${a.slug}`}
                        onClick={onClose}
                        className="block p-3 hover:bg-[#FAF0F0] transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={a.verification_status} />
                          <span className="font-data text-[11px] text-[#5F5B53]">
                            {a.category_name}
                          </span>
                        </div>
                        <p className="font-editorial font-bold text-[#0D0D0D] text-base leading-snug">
                          {a.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {data.results.entities.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-wider text-[#163A5F] mb-2">
                    <Users className="w-3.5 h-3.5" />
                    Database Entitas ({data.results.entities.length})
                  </h3>
                  <div className="divide-y divide-[#D6D1C6] border border-[#D6D1C6] bg-white">
                    {data.results.entities.slice(0, 4).map((ent) => (
                      <Link
                        key={ent.id}
                        href={`/database/${ent.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 hover:bg-[#EFECE6] transition-colors gap-3"
                      >
                        <div>
                          <p className="font-semibold text-sm text-[#0D0D0D]">
                            {ent.name}
                          </p>
                          <p className="text-xs text-[#5F5B53]">
                            {ent.current_role}
                          </p>
                        </div>
                        <span className="font-data text-[10px] uppercase px-2 py-0.5 border border-[#141414]">
                          {ent.entity_type}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {data.results.documents.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-wider text-[#0D0D0D] mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    Dokumen Terbuka & PDF ({data.results.documents.length})
                  </h3>
                  <div className="divide-y divide-[#D6D1C6] border border-[#D6D1C6] bg-white">
                    {data.results.documents.slice(0, 4).map((doc) => (
                      <Link
                        key={doc.id}
                        href={`/dokumen/${doc.id}`}
                        onClick={onClose}
                        className="block p-3 hover:bg-[#EFECE6] transition-colors"
                      >
                        <div className="flex items-center gap-2 font-data text-[11px] text-[#9E1B1B] font-semibold">
                          <span>{doc.doc_number}</span>
                          <span>•</span>
                          <span>{doc.page_count} HLM PDF</span>
                        </div>
                        <p className="text-sm font-semibold text-[#0D0D0D] mt-0.5">
                          {doc.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {(data.results.timeline.length > 0 ||
                data.results.questions.length > 0 ||
                data.results.replies.length > 0) && (
                <div className="grid sm:grid-cols-3 gap-3 text-xs font-data">
                  {data.results.timeline.length > 0 && (
                    <Link
                      href={`/cari?q=${encodeURIComponent(data.query)}&type=timeline`}
                      onClick={onClose}
                      className="p-3 bg-white border border-[#D6D1C6] hover:border-[#141414] flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-[#9E1B1B]" />
                      <span>{data.results.timeline.length} Peristiwa Timeline</span>
                    </Link>
                  )}
                  {data.results.questions.length > 0 && (
                    <Link
                      href={`/cari?q=${encodeURIComponent(data.query)}&type=questions`}
                      onClick={onClose}
                      className="p-3 bg-white border border-[#D6D1C6] hover:border-[#141414] flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4 text-[#9E1B1B]" />
                      <span>{data.results.questions.length} Pertanyaan Terbuka</span>
                    </Link>
                  )}
                  {data.results.replies.length > 0 && (
                    <Link
                      href={`/cari?q=${encodeURIComponent(data.query)}&type=replies`}
                      onClick={onClose}
                      className="p-3 bg-white border border-[#D6D1C6] hover:border-[#141414] flex items-center gap-2"
                    >
                      <Scale className="w-4 h-4 text-[#581C87]" />
                      <span>{data.results.replies.length} Hak Jawab</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
