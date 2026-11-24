import type { Metadata } from "next";
import {
  listArticles,
  listDocuments,
  listEntities,
  listRightOfReplies,
  listTimelineEvents,
  listUnansweredQuestions,
} from "@/lib/db/queries";
import { SearchPageClient } from "@/components/SearchPageClient";

export const metadata: Metadata = {
  title: "Pencarian Global Arsip Bongkar Danantara",
  description:
    "Cari lintas laporan investigasi, database pejabat dan BUMN, dokumen PDF, peristiwa timeline, pertanyaan terbuka, dan hak jawab.",
};

export default function SearchPage() {
  const articles = listArticles();
  const entities = listEntities();
  const documents = listDocuments();
  const timeline = listTimelineEvents();
  const questions = listUnansweredQuestions();
  const replies = listRightOfReplies(false);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="border-b-2 border-[#141414] pb-5">
        <p className="font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
          MESIN PENCARIAN GLOBAL LINTAS ARSIP
        </p>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] mt-1">
          Cari di Seluruh Arsip Bongkar Danantara
        </h1>
      </header>

      <SearchPageClient
        articles={articles}
        entities={entities}
        documents={documents}
        timeline={timeline}
        questions={questions}
        replies={replies}
      />
    </div>
  );
}
