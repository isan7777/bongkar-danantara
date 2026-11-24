import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDocumentByIdOrSlug, listDocuments } from "@/lib/db/queries";
import { DocumentViewerClient } from "@/components/DocumentViewerClient";

export function generateStaticParams() {
  return listDocuments().map((d) => ({ id: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = getDocumentByIdOrSlug(id);
  if (!doc) return { title: "Dokumen Tidak Ditemukan" };
  return {
    title: `${doc.doc_number} — ${doc.title}`,
    description: doc.summary,
  };
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = getDocumentByIdOrSlug(id);
  if (!doc) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-[#D6D1C6] pb-3 font-data text-xs">
        <Link
          href="/dokumen"
          className="inline-flex items-center gap-1.5 text-[#5F5B53] hover:text-[#9E1B1B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Vault Dokumen Terbuka
        </Link>
        <Link
          href="/dokumen/bandingkan"
          className="font-bold text-[#163A5F] hover:underline"
        >
          Bandingkan dengan Dokumen Lain →
        </Link>
      </div>

      <DocumentViewerClient document={doc} />
    </div>
  );
}
