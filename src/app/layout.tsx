import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:
      "BONGKAR DANANTARA — Platform Investigasi & Dokumentasi Pengawasan Aset Negara",
    template: "%s | BONGKAR DANANTARA",
  },
  description:
    "Uang Rakyat, Kekuasaan Besar, Transparansi Harus Dibuka. Platform investigasi independen untuk memeriksa, mendokumentasikan, dan mengawasi pengelolaan investasi dan aset negara oleh Danantara Indonesia.",
  keywords: [
    "Bongkar Danantara",
    "Danantara Indonesia",
    "Investigasi BUMN",
    "Transparansi Aset Negara",
    "UU Nomor 1 Tahun 2025",
    "UU Nomor 16 Tahun 2025",
    "Pengawasan Publik",
    "Dokumen Terbuka",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "BONGKAR DANANTARA",
    title: "BONGKAR DANANTARA — Uang Rakyat, Kekuasaan Besar, Transparansi Harus Dibuka",
    description:
      "Pusat investigasi, database entitas, arsip dokumen terbuka, dan pengawasan publik terhadap Danantara Indonesia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BONGKAR DANANTARA",
    description: "Uang Rakyat, Kekuasaan Besar, Transparansi Harus Dibuka.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#0D0D0D]">
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[#9E1B1B] focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-mono"
        >
          Langsung ke konten utama
        </a>
        <SiteHeader />
        <main id="konten-utama" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
