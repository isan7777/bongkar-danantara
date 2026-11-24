import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { listTimelineEvents } from "@/lib/db/queries";
import { TimelineListClient } from "@/components/TimelineListClient";

export const metadata: Metadata = {
  title: "Timeline Keputusan Penting Danantara (2025-2026)",
  description:
    "Kronologi terverifikasi pengesahan UU No. 1/2025, peluncuran Danantara, PP 10 & 15/2025, pengangkatan pengurus, uji materi MK, UU No. 16/2025, hingga audit perdana 2026.",
};

export default function TimelinePage() {
  const events = listTimelineEvents();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="border-b-2 border-[#141414] pb-5">
        <div className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
          <Clock className="w-4 h-4" />
          JEJAK KRONOLOGIS KEBIJAKAN &amp; HUKUM
        </div>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold text-[#0D0D0D] mt-1">
          Timeline Keputusan Penting Danantara
        </h1>
        <p className="mt-2 text-base text-[#3F3D39]">
          Rangkaian keputusan regulasi, pengangkatan pejabat, pengalihan aset,
          sengketa konstitusi di Mahkamah Konstitusi, dan agenda audit publik yang
          didokumentasikan bersama sumber primernya.
        </p>
      </header>

      <TimelineListClient events={events} />
    </div>
  );
}
