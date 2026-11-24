"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShieldAlert, X, Lock } from "lucide-react";
import { GlobalSearchModal } from "./GlobalSearchModal";

const PRIMARY_NAV = [
  { href: "/investigasi", label: "Investigasi" },
  { href: "/database", label: "Database Entitas" },
  { href: "/dokumen", label: "Dokumen & PDF" },
  { href: "/keuangan", label: "Data Keuangan" },
  { href: "/timeline", label: "Timeline" },
  { href: "/hak-jawab", label: "Hak Jawab & Koreksi" },
  { href: "/metodologi", label: "Metodologi" },
];

const CATEGORY_STRIP = [
  { href: "/kategori/jejak-uang", label: "A. Jejak Uang" },
  { href: "/kategori/siapa-di-balik-kekuasaan", label: "B. Siapa di Balik Kekuasaan?" },
  { href: "/kategori/dokumen-terbuka", label: "C. Dokumen Terbuka" },
  { href: "/kategori/konflik-kepentingan", label: "D. Konflik Kepentingan" },
  { href: "/kategori/kebijakan-bermasalah", label: "E. Kebijakan Bermasalah" },
  { href: "/kategori/investigasi-mendalam", label: "F. Investigasi Mendalam" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="bg-[#F7F6F2] border-b-2 border-[#141414]">
        {/* Top utility bar */}
        <div className="bg-[#141414] text-[#E8E4DC] text-[11px] font-data tracking-wide">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 bg-[#9E1B1B]" aria-hidden="true" />
              <span className="uppercase font-semibold">
                MEJA PENGAWASAN INDEPENDEN // EDISI ARSIP TERBUKA
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/lapor/cek"
                className="hover:text-white underline-offset-4 hover:underline"
              >
                Cek Status Laporan
              </Link>
              <span className="text-[#5F5B53]">|</span>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 hover:text-white underline-offset-4 hover:underline"
              >
                <Lock className="w-3 h-3" />
                Meja Redaksi
              </Link>
            </div>
          </div>
        </div>

        {/* Masthead */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 border-b border-[#141414]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <Link href="/" className="group inline-block">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block w-3 h-8 sm:h-10 bg-[#9E1B1B]" />
                  <span className="font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0D0D0D] leading-none">
                    BONGKAR DANANTARA
                  </span>
                </div>
              </Link>
              <p className="mt-2 font-data text-xs sm:text-[13px] text-[#3F3D39] tracking-tight">
                Uang Rakyat, Kekuasaan Besar, Transparansi Harus Dibuka.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start lg:self-end">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#141414] hover:border-[#9E1B1B] text-xs font-data text-[#0D0D0D] transition-colors"
                aria-label="Buka pencarian global"
              >
                <Search className="w-3.5 h-3.5 text-[#9E1B1B]" />
                <span>Cari Arsip</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-[#EFECE6] border border-[#D6D1C6] text-[10px] text-[#5F5B53]">
                  Ctrl+K
                </kbd>
              </button>

              <Link
                href="/lapor"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#9E1B1B] hover:bg-[#781111] text-white text-xs font-data font-semibold uppercase tracking-wider transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Kirim Laporan</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden p-2 border border-[#141414] bg-white text-[#0D0D0D]"
                aria-label="Buka menu navigasi"
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Primary Desktop Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="hidden lg:block border-b border-[#D6D1C6] bg-[#F7F6F2]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <ul className="flex items-center gap-1">
              {PRIMARY_NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-3.5 py-3 text-[13px] font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                        active
                          ? "border-[#9E1B1B] text-[#9E1B1B]"
                          : "border-transparent text-[#0D0D0D] hover:text-[#9E1B1B]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/dokumen/bandingkan"
              className="font-data text-[11px] uppercase tracking-wider text-[#163A5F] hover:text-[#9E1B1B] font-semibold"
            >
              Bandingkan Laporan
            </Link>
          </div>
        </nav>

        {/* Category Pillar Strip */}
        <div className="hidden lg:block bg-[#EFECE6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-5 overflow-x-auto">
            <span className="font-data text-[10px] font-bold uppercase tracking-widest text-[#9E1B1B] shrink-0">
              DESK INVESTIGASI:
            </span>
            {CATEGORY_STRIP.map((c) => {
              const active = pathname === c.href;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className={`font-data text-[11px] whitespace-nowrap transition-colors ${
                    active
                      ? "text-[#9E1B1B] font-bold underline underline-offset-4"
                      : "text-[#2F2E2B] hover:text-[#9E1B1B]"
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#141414] px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 border border-[#D6D1C6] text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] hover:border-[#9E1B1B]"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/dokumen/bandingkan"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 border border-[#163A5F] text-xs font-semibold uppercase tracking-wider text-[#163A5F]"
              >
                Bandingkan Laporan
              </Link>
            </div>
            <div className="border-t border-[#D6D1C6] pt-3">
              <p className="font-data text-[10px] font-bold uppercase tracking-widest text-[#9E1B1B] mb-2">
                6 Kategori Investigasi
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {CATEGORY_STRIP.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-data text-xs text-[#2F2E2B] py-1 hover:text-[#9E1B1B]"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
