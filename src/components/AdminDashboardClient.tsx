"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IS_STATIC_EXPORT } from "@/lib/paths";
import {
  Lock,
  LogOut,
  Newspaper,
  ShieldAlert,
  FileText,
  Users,
  Scale,
  HelpCircle,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import type {
  ArticleRecord,
  DocumentRecord,
  EntityRecord,
  ModerationStatus,
  QuestionStatus,
  RightOfReplyRecord,
  UnansweredQuestionRecord,
  VerificationStatus,
  WhistleblowerReportRecord,
} from "@/types/domain";
import type { AdminSession } from "@/lib/auth";
import { StatusBadge } from "./StatusBadge";
import {
  formatIndonesianDate,
  getModerationStatusLabel,
  getQuestionStatusStyles,
} from "@/lib/format";

interface AdminDashboardClientProps {
  initialStats: {
    articlesPublished: number;
    documentsTotal: number;
    entitiesTotal: number;
    relationsTotal: number;
    unansweredOpen: number;
    repliesTotal: number;
    reportsPending: number;
    reportsTotal: number;
  };
  initialArticles: ArticleRecord[];
  initialDocuments: DocumentRecord[];
  initialEntities: EntityRecord[];
  initialReplies: RightOfReplyRecord[];
  initialQuestions: UnansweredQuestionRecord[];
}

export function AdminDashboardClient({
  initialStats,
  initialArticles,
  initialDocuments,
  initialEntities,
  initialReplies,
  initialQuestions,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [stats] = useState(initialStats);
  const [articles, setArticles] = useState<ArticleRecord[]>(initialArticles);
  const [reports, setReports] = useState<WhistleblowerReportRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [entities, setEntities] = useState<EntityRecord[]>(initialEntities);
  const [replies, setReplies] = useState<RightOfReplyRecord[]>(initialReplies);
  const [questions, setQuestions] =
    useState<UnansweredQuestionRecord[]>(initialQuestions);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  async function hydratePrivilegedData() {
    if (IS_STATIC_EXPORT) return;
    const [artRes, repRes, docRes, entRes, rorRes, qRes] = await Promise.all([
      fetch("/api/articles?includeDrafts=1"),
      fetch("/api/reports"),
      fetch("/api/documents"),
      fetch("/api/entities"),
      fetch("/api/replies?includePending=1"),
      fetch("/api/questions"),
    ]);
    if (artRes.ok) {
      const d = await artRes.json();
      setArticles(d.articles || []);
    }
    if (repRes.ok) {
      const d = await repRes.json();
      const list = (d.reports || []) as WhistleblowerReportRecord[];
      setReports(list);
      const map: Record<
        string,
        { status: ModerationStatus; publicNote: string; internalNote: string }
      > = {};
      for (const r of list) {
        map[r.id] = {
          status: r.moderation_status,
          publicNote: r.editor_public_note || "",
          internalNote: r.editor_internal_note || "",
        };
      }
      setReportDrafts(map);
    }
    if (docRes.ok) {
      const d = await docRes.json();
      setDocuments(d.documents || []);
    }
    if (entRes.ok) {
      const d = await entRes.json();
      setEntities(d.entities || []);
    }
    if (rorRes.ok) {
      const d = await rorRes.json();
      setReplies(d.replies || []);
    }
    if (qRes.ok) {
      const d = await qRes.json();
      setQuestions(d.questions || []);
    }
  }

  useEffect(() => {
    if (IS_STATIC_EXPORT) return;
    fetch("/api/auth/login")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated && d.user) {
          setSession(d.user as AdminSession);
          hydratePrivilegedData();
        }
      })
      .catch(() => {});
  }, []);

  const [activeTab, setActiveTab] = useState<
    "overview" | "articles" | "reports" | "documents" | "entities" | "accountability"
  >("overview");
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    msg: string;
  } | null>(null);

  // Article creation state
  const [artTitle, setArtTitle] = useState("");
  const [artSubtitle, setArtSubtitle] = useState("");
  const [artExcerpt, setArtExcerpt] = useState("");
  const [artCategory, setArtCategory] = useState("investigasi-mendalam");
  const [artStatus, setArtStatus] = useState<VerificationStatus>("TERDOKUMENTASI");
  const [artAuthors, setArtAuthors] = useState("Tim Investigasi Bongkar Danantara");
  const [artMethodology, setArtMethodology] = useState(
    "Diverifikasi melalui dokumen publik primer dan perbandingan silang data resmi."
  );
  const [artBody, setArtBody] = useState("");
  const [artSrcTitle, setArtSrcTitle] = useState("");
  const [artSrcPub, setArtSrcPub] = useState("");
  const [artSrcPage, setArtSrcPage] = useState("hlm. 1");
  const [artSrcQuote, setArtSrcQuote] = useState("");
  const [artDocId, setArtDocId] = useState("");

  // Correction modal state
  const [corArticleId, setCorArticleId] = useState<string | null>(null);
  const [corType, setCorType] = useState("KOREKSI_DATA");
  const [corSummary, setCorSummary] = useState("");
  const [corPrev, setCorPrev] = useState("");
  const [corNext, setCorNext] = useState("");

  // Moderation draft notes keyed by report id
  const [reportDrafts, setReportDrafts] = useState<
    Record<
      string,
      {
        status: ModerationStatus;
        publicNote: string;
        internalNote: string;
      }
    >
  >(() => {
    const map: Record<
      string,
      { status: ModerationStatus; publicNote: string; internalNote: string }
    > = {};
    for (const r of reports) {
      map[r.id] = {
        status: r.moderation_status,
        publicNote: r.editor_public_note || "",
        internalNote: r.editor_internal_note || "",
      };
    }
    return map;
  });

  // Document upload state
  const [docTitle, setDocTitle] = useState("");
  const [docNum, setDocNum] = useState("");
  const [docIssuer, setDocIssuer] = useState("");
  const [docType, setDocType] = useState("REGULASI");
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [docYear, setDocYear] = useState("2026");
  const [docPages, setDocPages] = useState("1");
  const [docUrl, setDocUrl] = useState("https://peraturan.bpk.go.id/");
  const [docStatus, setDocStatus] = useState("TERDOKUMENTASI");
  const [docSummary, setDocSummary] = useState("");
  const [docQuote, setDocQuote] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  // Entity creation state
  const [entName, setEntName] = useState("");
  const [entType, setEntType] = useState("INDIVIDU");
  const [entRole, setEntRole] = useState("");
  const [entOrg, setEntOrg] = useState("");
  const [entSector, setEntSector] = useState("Tata Kelola & Regulasi");
  const [entValue, setEntValue] = useState("");
  const [entYear, setEntYear] = useState("2025");
  const [entStatus, setEntStatus] = useState("TERDOKUMENTASI");
  const [entSummary, setEntSummary] = useState("");
  const [entSrcRef, setEntSrcRef] = useState("");

  // Question creation state
  const [qText, setQText] = useState("");
  const [qContext, setQContext] = useState("");
  const [qAddressed, setQAddressed] = useState("Badan Pelaksana BPI Danantara");
  const [qCategory, setQCategory] = useState("Jejak Uang");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (IS_STATIC_EXPORT) {
        setAuthError(
          "Autentikasi meja redaksi dinonaktifkan pada edisi arsip statis GitHub Pages. Jalankan server Node.js dengan variabel lingkungan BONGKAR_ADMIN_USERNAME, BONGKAR_ADMIN_PASSWORD, dan BONGKAR_SESSION_SECRET untuk masuk ke Dashboard Admin."
        );
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Gagal masuk.");
        return;
      }
      setSession(data.user as AdminSession);
      await hydratePrivilegedData();
      router.refresh();
    } catch {
      setAuthError("Gangguan koneksi.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (!IS_STATIC_EXPORT) {
      await fetch("/api/auth/logout", { method: "POST" });
    }
    setSession(null);
    setReports([]);
    router.refresh();
  }

  function showNotice(type: "ok" | "err", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 6000);
  }

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();
    if (IS_STATIC_EXPORT) {
      showNotice("err", "Mode Statis GitHub Pages bersifat pratinjau baca-saja. Jalankan server Node.js untuk menyimpan ke SQLite.");
      return;
    }
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: artTitle,
        subtitle: artSubtitle,
        excerpt: artExcerpt,
        category_slug: artCategory,
        verification_status: artStatus,
        editorial_state: "PUBLISHED",
        authors: artAuthors,
        methodology: artMethodology,
        body_text: artBody,
        source_title: artSrcTitle,
        source_publisher: artSrcPub,
        source_page_ref: artSrcPage,
        source_quote: artSrcQuote,
        document_id: artDocId || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice("err", data.error || "Gagal menerbitkan artikel.");
      return;
    }
    showNotice("ok", `Artikel diterbitkan (${data.id}).`);
    setArtTitle("");
    setArtSubtitle("");
    setArtExcerpt("");
    setArtBody("");
    setArtSrcTitle("");
    setArtSrcPub("");
    setArtSrcQuote("");
    await hydratePrivilegedData();
    router.refresh();
  }

  async function handleQuickArticleUpdate(
    id: string,
    patch: Record<string, unknown>
  ) {
    if (IS_STATIC_EXPORT) {
      showNotice("err", "Mode Statis GitHub Pages bersifat pratinjau baca-saja.");
      return;
    }
    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      showNotice("err", "Gagal memperbarui artikel.");
      return;
    }
    showNotice("ok", `Artikel ${id} berhasil diperbarui.`);
    await hydratePrivilegedData();
    router.refresh();
  }

  async function handleDeleteArticle(id: string) {
    if (IS_STATIC_EXPORT) {
      showNotice("err", "Mode Statis GitHub Pages bersifat pratinjau baca-saja.");
      return;
    }
    if (!window.confirm(`Hapus permanen artikel ${id}?`)) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showNotice("err", "Gagal menghapus artikel.");
      return;
    }
    showNotice("ok", `Artikel ${id} dihapus.`);
    await hydratePrivilegedData();
    router.refresh();
  }

  async function handleLogCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!corArticleId) return;
    const res = await fetch(`/api/articles/${corArticleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correction_note: {
          correction_type: corType,
          summary: corSummary,
          previous_text: corPrev || undefined,
          updated_text: corNext || undefined,
        },
      }),
    });
    if (!res.ok) {
      showNotice("err", "Gagal mencatat koreksi.");
      return;
    }
    showNotice("ok", `Catatan koreksi ditambahkan pada ${corArticleId}.`);
    setCorArticleId(null);
    setCorSummary("");
    setCorPrev("");
    setCorNext("");
    router.refresh();
  }

  async function handleSaveModeration(reportId: string) {
    const draft = reportDrafts[reportId];
    if (!draft) return;
    const res = await fetch(`/api/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moderation_status: draft.status,
        editor_public_note: draft.publicNote,
        editor_internal_note: draft.internalNote,
      }),
    });
    if (!res.ok) {
      showNotice("err", "Gagal menyimpan moderasi laporan.");
      return;
    }
    showNotice("ok", `Status moderasi laporan ${reportId} diperbarui.`);
    router.refresh();
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docFile) {
      showNotice("err", "Pilih file PDF yang valid terlebih dahulu.");
      return;
    }
    const fd = new FormData();
    fd.set("file", docFile);
    fd.set("title", docTitle);
    fd.set("doc_number", docNum);
    fd.set("issuer", docIssuer);
    fd.set("doc_type", docType);
    fd.set("published_date", docDate);
    fd.set("period_year", docYear);
    fd.set("page_count", docPages);
    fd.set("original_source_url", docUrl);
    fd.set("verification_status", docStatus);
    fd.set("summary", docSummary);
    fd.set("key_quote", docQuote);
    fd.set("key_quote_page", "1");

    const res = await fetch("/api/documents", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      showNotice("err", data.error || "Gagal mengunggah dokumen PDF.");
      return;
    }
    showNotice("ok", `Dokumen PDF diarsipkan (${data.id}).`);
    setDocTitle("");
    setDocNum("");
    setDocIssuer("");
    setDocSummary("");
    setDocQuote("");
    setDocFile(null);
    router.refresh();
  }

  async function handleCreateEntity(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: entName,
        entity_type: entType,
        current_role: entRole,
        organization: entOrg || null,
        sector: entSector,
        transaction_value_idr_t: entValue ? Number(entValue) : null,
        year_active: Number(entYear),
        verification_status: entStatus,
        summary: entSummary,
        source_ref: entSrcRef,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice("err", data.error || "Gagal menambah entitas.");
      return;
    }
    showNotice("ok", `Entitas baru tersimpan (${data.id}).`);
    setEntName("");
    setEntRole("");
    setEntOrg("");
    setEntValue("");
    setEntSummary("");
    setEntSrcRef("");
    router.refresh();
  }

  async function handleApproveReply(reply: RightOfReplyRecord) {
    const nextStatus =
      reply.status === "DIPUBLIKASIKAN" ? "MENUNGGU_MODERASI" : "DIPUBLIKASIKAN";
    const res = await fetch("/api/replies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: reply.id,
        status: nextStatus,
        editorial_verification_note: reply.editorial_verification_note,
      }),
    });
    if (!res.ok) {
      showNotice("err", "Gagal memperbarui status hak jawab.");
      return;
    }
    showNotice("ok", `Status Hak Jawab ${reply.id} diubah ke ${nextStatus}.`);
    router.refresh();
  }

  async function handleUpdateQuestionStatus(
    q: UnansweredQuestionRecord,
    newStatus: QuestionStatus
  ) {
    const res = await fetch("/api/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: q.id,
        status: newStatus,
        official_note: q.official_note || "",
      }),
    });
    if (!res.ok) {
      showNotice("err", "Gagal memperbarui status pertanyaan.");
      return;
    }
    showNotice("ok", `Pertanyaan ${q.code} diperbarui menjadi ${newStatus}.`);
    router.refresh();
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: qText,
        context: qContext,
        addressed_to: qAddressed,
        category: qCategory,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice("err", data.error || "Gagal menambah pertanyaan.");
      return;
    }
    showNotice("ok", `Pertanyaan terbuka ${data.code} ditambahkan.`);
    setQText("");
    setQContext("");
    router.refresh();
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border-2 border-[#141414] p-7 space-y-5">
          <div className="border-b-2 border-[#141414] pb-4 space-y-1">
            <div className="flex items-center gap-2 font-data text-xs font-bold uppercase tracking-widest text-[#9E1B1B]">
              <Lock className="w-4 h-4" />
              AKSES TERBATAS MEJA REDAKSI
            </div>
            <h1 className="font-editorial text-3xl font-extrabold text-[#0D0D0D]">
              Dashboard Admin Bongkar Danantara
            </h1>
            <p className="text-xs text-[#5F5B53]">
              Autentikasi cookie HttpOnly terenkripsi HMAC-SHA256 diperlukan untuk
              mengelola artikel, dokumen PDF, database entitas, dan moderasi laporan
              pelapor.
            </p>
          </div>

          {authError && (
            <div className="bg-[#FAF0F0] border border-[#9E1B1B] p-3 text-xs text-[#781111] font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="adm-user"
                className="block font-data text-xs font-bold uppercase text-[#0D0D0D] mb-1"
              >
                Nama Pengguna Redaksi
              </label>
              <input
                id="adm-user"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] text-sm font-data"
              />
            </div>

            <div>
              <label
                htmlFor="adm-pass"
                className="block font-data text-xs font-bold uppercase text-[#0D0D0D] mb-1"
              >
                Kata Sandi
              </label>
              <input
                id="adm-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi meja redaksi..."
                className="w-full px-3 py-2.5 border border-[#141414] bg-[#F7F6F2] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase tracking-widest transition-colors"
            >
              {authLoading ? "Memverifikasi..." : "Masuk ke Meja Redaksi"}
            </button>
          </form>

          <p className="text-[11px] font-data text-[#5F5B53] border-t border-[#EFECE6] pt-3">
            Akses redaksi dikelola melalui variabel lingkungan server
            terenkripsi dan tidak disimpan di repositori publik.
          </p>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="bg-[#141414] text-white p-5 sm:p-6 border-b-4 border-[#9E1B1B] flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-data text-[11px] font-bold uppercase tracking-widest text-[#FCA5A5]">
            MEJA REDAKSI &amp; MODERASI TERAUTENTIKASI
          </p>
          <h1 className="font-editorial text-2xl sm:text-3xl font-extrabold mt-0.5">
            Dashboard Pengelolaan Bongkar Danantara
          </h1>
          <p className="font-data text-xs text-[#C7C2B6] mt-1">
            Masuk sebagai: <strong>{session.displayName}</strong> ({session.username} • {session.role})
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9E1B1B] hover:bg-[#781111] text-white font-data text-xs font-bold uppercase tracking-wider"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Sesi
        </button>
      </header>

      {feedback && (
        <div
          role="status"
          className={`p-4 border-2 flex items-center gap-2 text-sm font-medium ${
            feedback.type === "ok"
              ? "bg-[#E6F4EA] border-[#166534] text-[#14532D]"
              : "bg-[#FAF0F0] border-[#9E1B1B] text-[#781111]"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#141414] pb-3">
        {(
          [
            { id: "overview", label: "Ringkasan", icon: Lock },
            { id: "articles", label: `Artikel (${articles.length})`, icon: Newspaper },
            {
              id: "reports",
              label: `Moderasi Laporan (${stats.reportsPending} aktif)`,
              icon: ShieldAlert,
            },
            { id: "documents", label: `Dokumen PDF (${documents.length})`, icon: FileText },
            { id: "entities", label: `Entitas (${entities.length})`, icon: Users },
            {
              id: "accountability",
              label: `Hak Jawab & Pertanyaan`,
              icon: Scale,
            },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-data text-xs font-bold uppercase tracking-wider border transition-colors ${
                activeTab === t.id
                  ? "bg-[#9E1B1B] text-white border-[#9E1B1B]"
                  : "bg-white text-[#0D0D0D] border-[#141414] hover:bg-[#EFECE6]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-[#141414] p-5">
            <p className="font-data text-[10px] uppercase text-[#5F5B53]">
              LAPORAN TERPUBLIKASI
            </p>
            <p className="font-data text-3xl font-bold mt-1">
              {stats.articlesPublished}
            </p>
          </div>
          <div className="bg-white border-2 border-[#9E1B1B] p-5">
            <p className="font-data text-[10px] uppercase text-[#9E1B1B]">
              ANTREAN LAPORAN PELAPOR
            </p>
            <p className="font-data text-3xl font-bold text-[#9E1B1B] mt-1">
              {stats.reportsPending} / {stats.reportsTotal}
            </p>
          </div>
          <div className="bg-white border border-[#141414] p-5">
            <p className="font-data text-[10px] uppercase text-[#5F5B53]">
              ARSIP PDF TERINDEKS
            </p>
            <p className="font-data text-3xl font-bold mt-1">
              {stats.documentsTotal}
            </p>
          </div>
          <div className="bg-white border border-[#141414] p-5">
            <p className="font-data text-[10px] uppercase text-[#5F5B53]">
              ENTITAS &amp; RELASI DATABASE
            </p>
            <p className="font-data text-3xl font-bold mt-1">
              {stats.entitiesTotal} / {stats.relationsTotal}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: ARTICLES & CORRECTIONS */}
      {activeTab === "articles" && (
        <div className="space-y-8">
          {/* Article Management Table */}
          <div className="bg-white border-2 border-[#141414] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] text-white font-data uppercase">
                  <th className="p-3">Artikel</th>
                  <th className="p-3">Status Verifikasi</th>
                  <th className="p-3">Tayang</th>
                  <th className="p-3">Aksi Redaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D1C6]">
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3">
                      <Link
                        href={`/investigasi/${a.slug}`}
                        className="font-bold text-sm text-[#0D0D0D] hover:text-[#9E1B1B]"
                      >
                        {a.title}
                      </Link>
                      <p className="font-data text-[11px] text-[#5F5B53] mt-0.5">
                        {a.id} • {a.category_name} • Diperbarui{" "}
                        {formatIndonesianDate(a.updated_at)}
                      </p>
                    </td>
                    <td className="p-3">
                      <select
                        value={a.verification_status}
                        onChange={(e) =>
                          handleQuickArticleUpdate(a.id, {
                            verification_status: e.target.value,
                          })
                        }
                        aria-label={`Status verifikasi ${a.id}`}
                        className="px-2 py-1 border border-[#141414] bg-[#F7F6F2] font-data text-[11px]"
                      >
                        <option value="TERBUKTI">TERBUKTI</option>
                        <option value="TERDOKUMENTASI">TERDOKUMENTASI</option>
                        <option value="DUGAAN">DUGAAN</option>
                        <option value="BELUM TERVERIFIKASI">
                          BELUM TERVERIFIKASI
                        </option>
                        <option value="BANTAHAN">BANTAHAN</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickArticleUpdate(a.id, {
                            editorial_state:
                              a.editorial_state === "PUBLISHED"
                                ? "DRAFT"
                                : "PUBLISHED",
                          })
                        }
                        className={`px-2.5 py-1 font-data text-[10px] font-bold uppercase border ${
                          a.editorial_state === "PUBLISHED"
                            ? "bg-[#E6F4EA] text-[#14532D] border-[#166534]"
                            : "bg-[#EFECE6] text-[#5F5B53] border-[#78716C]"
                        }`}
                      >
                        {a.editorial_state}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorArticleId(a.id)}
                          className="px-2.5 py-1 border border-[#163A5F] text-[#163A5F] hover:bg-[#163A5F] hover:text-white font-data text-[10px] font-bold uppercase"
                        >
                          + Catatan Koreksi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(a.id)}
                          className="p-1 text-[#9E1B1B] hover:bg-[#FAF0F0]"
                          title="Hapus artikel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Correction Form when an article is selected */}
          {corArticleId && (
            <form
              onSubmit={handleLogCorrection}
              className="bg-[#FAF0F0] border-2 border-[#9E1B1B] p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-data text-xs font-bold uppercase text-[#9E1B1B]">
                  TAMBAH CATATAN KOREKSI TERBUKA UNTUK {corArticleId}
                </h3>
                <button
                  type="button"
                  onClick={() => setCorArticleId(null)}
                  className="font-data text-xs underline"
                >
                  Batal
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={corType}
                  onChange={(e) => setCorType(e.target.value)}
                  className="px-3 py-2 border border-[#141414] bg-white text-xs font-data"
                >
                  <option value="KOREKSI_DATA">KOREKSI_DATA</option>
                  <option value="PEMBARUAN_DOKUMEN">PEMBARUAN_DOKUMEN</option>
                  <option value="TAMBAHAN_HAK_JAWAB">TAMBAHAN_HAK_JAWAB</option>
                  <option value="KLARIFIKASI">KLARIFIKASI</option>
                </select>
                <input
                  type="text"
                  required
                  minLength={10}
                  value={corSummary}
                  onChange={(e) => setCorSummary(e.target.value)}
                  placeholder="Ringkasan koreksi yang ditampilkan ke publik..."
                  className="px-3 py-2 border border-[#141414] bg-white text-xs"
                />
                <input
                  type="text"
                  value={corPrev}
                  onChange={(e) => setCorPrev(e.target.value)}
                  placeholder="Teks sebelumnya (opsional)..."
                  className="px-3 py-2 border border-[#D6D1C6] bg-white text-xs"
                />
                <input
                  type="text"
                  value={corNext}
                  onChange={(e) => setCorNext(e.target.value)}
                  placeholder="Teks setelah diperbarui (opsional)..."
                  className="px-3 py-2 border border-[#D6D1C6] bg-white text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase"
              >
                Simpan Catatan Koreksi
              </button>
            </form>
          )}

          {/* Publish New Article Form */}
          <form
            onSubmit={handleCreateArticle}
            className="bg-white border-2 border-[#141414] p-6 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-[#D6D1C6] pb-3">
              <Plus className="w-4 h-4 text-[#9E1B1B]" />
              <h2 className="font-editorial text-2xl font-bold">
                Terbitkan Laporan Investigasi Baru
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                minLength={10}
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
                placeholder="Judul tajam laporan investigasi *"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
              />
              <select
                value={artCategory}
                onChange={(e) => setArtCategory(e.target.value)}
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
              >
                <option value="jejak-uang">A. Jejak Uang</option>
                <option value="siapa-di-balik-kekuasaan">
                  B. Siapa di Balik Kekuasaan?
                </option>
                <option value="dokumen-terbuka">C. Dokumen Terbuka</option>
                <option value="konflik-kepentingan">D. Konflik Kepentingan</option>
                <option value="kebijakan-bermasalah">E. Kebijakan Bermasalah</option>
                <option value="investigasi-mendalam">F. Investigasi Mendalam</option>
              </select>
            </div>

            <input
              type="text"
              required
              minLength={10}
              value={artSubtitle}
              onChange={(e) => setArtSubtitle(e.target.value)}
              placeholder="Subjudul / dek investigasi *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <input
              type="text"
              required
              minLength={10}
              value={artExcerpt}
              onChange={(e) => setArtExcerpt(e.target.value)}
              placeholder="Ringkasan pendek untuk kartu indeks *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />

            <div className="grid sm:grid-cols-3 gap-4">
              <select
                value={artStatus}
                onChange={(e) =>
                  setArtStatus(e.target.value as VerificationStatus)
                }
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm font-data"
              >
                <option value="TERBUKTI">TERBUKTI</option>
                <option value="TERDOKUMENTASI">TERDOKUMENTASI</option>
                <option value="DUGAAN">DUGAAN</option>
                <option value="BELUM TERVERIFIKASI">BELUM TERVERIFIKASI</option>
                <option value="BANTAHAN">BANTAHAN</option>
              </select>
              <input
                type="text"
                required
                value={artAuthors}
                onChange={(e) => setArtAuthors(e.target.value)}
                placeholder="Penulis / Tim *"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
              />
              <select
                value={artDocId}
                onChange={(e) => setArtDocId(e.target.value)}
                className="px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
              >
                <option value="">Tautkan Arsip PDF (Opsional)</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} — {d.doc_number}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={5}
              required
              minLength={40}
              value={artBody}
              onChange={(e) => setArtBody(e.target.value)}
              placeholder="Isi laporan lengkap (pisahkan paragraf dengan baris kosong) *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <input
              type="text"
              required
              value={artMethodology}
              onChange={(e) => setArtMethodology(e.target.value)}
              placeholder="Metodologi verifikasi *"
              className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
            />

            <div className="p-4 bg-[#FAF9F6] border border-[#141414] space-y-3">
              <p className="font-data text-xs font-bold uppercase text-[#9E1B1B]">
                WAJIB: BUKTI DAN SUMBER PRIMER
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={artSrcTitle}
                  onChange={(e) => setArtSrcTitle(e.target.value)}
                  placeholder="Judul dokumen sumber *"
                  className="px-3 py-2 border border-[#141414] bg-white text-xs"
                />
                <input
                  type="text"
                  required
                  value={artSrcPub}
                  onChange={(e) => setArtSrcPub(e.target.value)}
                  placeholder="Penerbit / Otoritas *"
                  className="px-3 py-2 border border-[#141414] bg-white text-xs"
                />
                <input
                  type="text"
                  required
                  value={artSrcPage}
                  onChange={(e) => setArtSrcPage(e.target.value)}
                  placeholder="Nomor halaman / pasal *"
                  className="px-3 py-2 border border-[#141414] bg-white text-xs font-data"
                />
              </div>
              <input
                type="text"
                required
                minLength={10}
                value={artSrcQuote}
                onChange={(e) => setArtSrcQuote(e.target.value)}
                placeholder="Kutipan langsung dari sumber *"
                className="w-full px-3 py-2 border border-[#141414] bg-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-[#9E1B1B] hover:bg-[#781111] text-white font-data text-xs font-bold uppercase tracking-wider"
            >
              Terbitkan Laporan Investigasi
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: WHISTLEBLOWER MODERATION QUEUE */}
      {activeTab === "reports" && (
        <div className="space-y-5">
          {reports.map((r) => {
            const draft = reportDrafts[r.id] || {
              status: r.moderation_status,
              publicNote: r.editor_public_note || "",
              internalNote: r.editor_internal_note || "",
            };
            const modBadge = getModerationStatusLabel(r.moderation_status);
            return (
              <div
                key={r.id}
                className="bg-white border-2 border-[#141414] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6D1C6] pb-3">
                  <div className="flex flex-wrap items-center gap-2 font-data text-xs">
                    <span className="px-2 py-0.5 bg-[#141414] text-white font-bold">
                      {r.tracking_code}
                    </span>
                    <span className="px-2 py-0.5 bg-[#FAF0F0] text-[#9E1B1B] border border-[#9E1B1B] font-bold">
                      RISIKO: {r.risk_level}
                    </span>
                    <span className="text-[#5F5B53]">
                      Mode: {r.anonymity_mode}
                      {r.reporter_alias ? ` (${r.reporter_alias})` : ""}
                    </span>
                  </div>
                  <span
                    className={`font-data text-xs font-bold px-2.5 py-0.5 border ${modBadge.style}`}
                  >
                    {modBadge.label}
                  </span>
                </div>

                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#0D0D0D]">
                    {r.title}
                  </h3>
                  <p className="font-data text-xs text-[#5F5B53] mt-1">
                    Kategori: {r.category} • Entitas: {r.subject_entities} •
                    Periode: {r.incident_period}
                    {r.estimated_value ? ` • Nilai: ${r.estimated_value}` : ""}
                  </p>
                </div>

                <p className="text-sm text-[#1F1E1C] bg-[#FAF9F6] border border-[#D6D1C6] p-3.5 whitespace-pre-line leading-relaxed">
                  {r.chronology}
                </p>

                {r.attachment_original_name && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#EFECE6] border border-[#141414] font-data text-xs">
                    <span>
                      Lampiran Terisolasi:{" "}
                      <strong>{r.attachment_original_name}</strong> (SHA-256:{" "}
                      {r.attachment_sha256?.slice(0, 16)}...)
                    </span>
                    <a
                      href={`/api/reports/${r.id}?download=1`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#141414] text-white font-bold hover:bg-[#9E1B1B]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Bukti Aman
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-[#EFECE6]">
                  <div className="md:col-span-3">
                    <label className="block font-data text-[10px] font-bold uppercase text-[#5F5B53] mb-1">
                      Status Moderasi
                    </label>
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setReportDrafts((prev) => ({
                          ...prev,
                          [r.id]: {
                            ...draft,
                            status: e.target.value as ModerationStatus,
                          },
                        }))
                      }
                      className="w-full px-2.5 py-2 border border-[#141414] bg-[#F7F6F2] font-data text-xs"
                    >
                      <option value="DITERIMA">DITERIMA</option>
                      <option value="VERIFIKASI_AWAL">VERIFIKASI_AWAL</option>
                      <option value="INVESTIGASI_LANJUT">INVESTIGASI_LANJUT</option>
                      <option value="TERVERIFIKASI">TERVERIFIKASI</option>
                      <option value="DITOLAK">DITOLAK</option>
                      <option value="DIARSIPKAN">DIARSIPKAN</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block font-data text-[10px] font-bold uppercase text-[#163A5F] mb-1">
                      Pesan untuk Pelapor (Terbaca via Kode+PIN)
                    </label>
                    <input
                      type="text"
                      value={draft.publicNote}
                      onChange={(e) =>
                        setReportDrafts((prev) => ({
                          ...prev,
                          [r.id]: { ...draft, publicNote: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-2 border border-[#163A5F] bg-white text-xs"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-data text-[10px] font-bold uppercase text-[#9E1B1B] mb-1">
                      Catatan Internal Redaksi (Rahasia)
                    </label>
                    <input
                      type="text"
                      value={draft.internalNote}
                      onChange={(e) =>
                        setReportDrafts((prev) => ({
                          ...prev,
                          [r.id]: { ...draft, internalNote: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-2 border border-[#D6D1C6] bg-white text-xs"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => handleSaveModeration(r.id)}
                      className="w-full py-2 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: UPLOAD PDF DOCUMENT */}
      {activeTab === "documents" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleUploadDocument}
            className="lg:col-span-6 bg-white border-2 border-[#141414] p-6 space-y-3.5"
          >
            <h2 className="font-editorial text-2xl font-bold border-b border-[#D6D1C6] pb-2">
              Unggah Arsip Dokumen PDF Baru
            </h2>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Judul dokumen *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={docNum}
                onChange={(e) => setDocNum(e.target.value)}
                placeholder="Nomor dokumen *"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm font-data"
              />
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm font-data"
              >
                <option value="REGULASI">REGULASI</option>
                <option value="LAPORAN_KEUANGAN">LAPORAN_KEUANGAN</option>
                <option value="KEPUTUSAN_PRESIDEN">KEPUTUSAN_PRESIDEN</option>
                <option value="PUTUSAN_MK">PUTUSAN_MK</option>
                <option value="LAPORAN_TAHUNAN">LAPORAN_TAHUNAN</option>
                <option value="ANALISIS_DATA">ANALISIS_DATA</option>
              </select>
            </div>
            <input
              type="text"
              required
              value={docIssuer}
              onChange={(e) => setDocIssuer(e.target.value)}
              placeholder="Penerbit / Otoritas sumber *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="date"
                required
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-xs font-data"
              />
              <input
                type="number"
                required
                value={docYear}
                onChange={(e) => setDocYear(e.target.value)}
                placeholder="Tahun"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-xs font-data"
              />
              <input
                type="number"
                required
                min={1}
                value={docPages}
                onChange={(e) => setDocPages(e.target.value)}
                placeholder="Jumlah hlm"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-xs font-data"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="url"
                required
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="URL Sumber Asli *"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-xs"
              />
              <select
                value={docStatus}
                onChange={(e) => setDocStatus(e.target.value)}
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-xs font-data"
              >
                <option value="TERBUKTI">TERBUKTI</option>
                <option value="TERDOKUMENTASI">TERDOKUMENTASI</option>
                <option value="BELUM TERVERIFIKASI">BELUM TERVERIFIKASI</option>
              </select>
            </div>
            <textarea
              rows={3}
              required
              value={docSummary}
              onChange={(e) => setDocSummary(e.target.value)}
              placeholder="Ringkasan isi dokumen *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <input
              type="text"
              required
              value={docQuote}
              onChange={(e) => setDocQuote(e.target.value)}
              placeholder="Kutipan kunci halaman 1 *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <input
              type="file"
              accept=".pdf"
              required
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              className="block w-full text-xs font-data"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase"
            >
              Unggah &amp; Indeks PDF
            </button>
          </form>

          <div className="lg:col-span-6 bg-white border border-[#141414] p-5 space-y-3">
            <h3 className="font-data text-xs font-bold uppercase tracking-widest text-[#5F5B53]">
              ARSIP TERINDEKS ({documents.length})
            </h3>
            <div className="divide-y divide-[#D6D1C6]">
              {documents.map((d) => (
                <div key={d.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dokumen/${d.id}`}
                      className="font-data text-xs font-bold text-[#9E1B1B] hover:underline"
                    >
                      {d.id} ({d.doc_number})
                    </Link>
                    <StatusBadge status={d.verification_status} />
                  </div>
                  <p className="text-sm font-semibold mt-0.5">{d.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ENTITIES */}
      {activeTab === "entities" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateEntity}
            className="lg:col-span-6 bg-white border-2 border-[#141414] p-6 space-y-3.5"
          >
            <h2 className="font-editorial text-2xl font-bold border-b border-[#D6D1C6] pb-2">
              Tambah Entitas ke Database Investigasi
            </h2>
            <input
              type="text"
              required
              value={entName}
              onChange={(e) => setEntName(e.target.value)}
              placeholder="Nama individu / perusahaan / proyek *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={entType}
                onChange={(e) => setEntType(e.target.value)}
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm font-data"
              >
                <option value="INDIVIDU">INDIVIDU</option>
                <option value="PERUSAHAAN">PERUSAHAAN</option>
                <option value="LEMBAGA">LEMBAGA</option>
                <option value="PROYEK">PROYEK</option>
              </select>
              <select
                value={entStatus}
                onChange={(e) => setEntStatus(e.target.value)}
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm font-data"
              >
                <option value="TERBUKTI">TERBUKTI</option>
                <option value="TERDOKUMENTASI">TERDOKUMENTASI</option>
                <option value="DUGAAN">DUGAAN</option>
                <option value="BELUM TERVERIFIKASI">BELUM TERVERIFIKASI</option>
              </select>
            </div>
            <input
              type="text"
              required
              value={entRole}
              onChange={(e) => setEntRole(e.target.value)}
              placeholder="Jabatan / peran utama *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={entOrg}
                onChange={(e) => setEntOrg(e.target.value)}
                placeholder="Organisasi / Induk"
                className="px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm"
              />
              <input
                type="text"
                required
                value={entSector}
                onChange={(e) => setEntSector(e.target.value)}
                placeholder="Sektor industri *"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                value={entValue}
                onChange={(e) => setEntValue(e.target.value)}
                placeholder="Nilai Aset/Transaksi (Rp T)"
                className="px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-sm font-data"
              />
              <input
                type="number"
                required
                value={entYear}
                onChange={(e) => setEntYear(e.target.value)}
                placeholder="Tahun aktif *"
                className="px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm font-data"
              />
            </div>
            <textarea
              rows={3}
              required
              minLength={15}
              value={entSummary}
              onChange={(e) => setEntSummary(e.target.value)}
              placeholder="Ringkasan faktual entitas *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <input
              type="text"
              required
              value={entSrcRef}
              onChange={(e) => setEntSrcRef(e.target.value)}
              placeholder="Referensi dokumen sumber *"
              className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#141414] hover:bg-[#9E1B1B] text-white font-data text-xs font-bold uppercase"
            >
              Simpan Profil Entitas
            </button>
          </form>

          <div className="lg:col-span-6 bg-white border border-[#141414] p-5 space-y-2 max-h-[600px] overflow-y-auto">
            <h3 className="font-data text-xs font-bold uppercase tracking-widest text-[#5F5B53]">
              ENTITAS TERDAFTAR ({entities.length})
            </h3>
            <div className="divide-y divide-[#EFECE6]">
              {entities.map((e) => (
                <Link
                  key={e.id}
                  href={`/database/${e.slug}`}
                  className="flex items-center justify-between py-2.5 hover:bg-[#FAF9F6]"
                >
                  <div>
                    <p className="font-semibold text-sm text-[#0D0D0D]">
                      {e.name}
                    </p>
                    <p className="text-xs text-[#5F5B53]">{e.current_role}</p>
                  </div>
                  <span className="font-data text-[10px] px-2 py-0.5 bg-[#EFECE6]">
                    {e.entity_type}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RIGHT OF REPLY & UNANSWERED QUESTIONS */}
      {activeTab === "accountability" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Replies Moderation */}
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl font-bold flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#581C87]" />
              Moderasi Hak Jawab ({replies.length})
            </h2>
            <div className="space-y-3">
              {replies.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-[#141414] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-data text-xs font-bold text-[#581C87]">
                      {r.id} • {r.respondent_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApproveReply(r)}
                      className={`px-2.5 py-1 font-data text-[10px] font-bold uppercase border ${
                        r.status === "DIPUBLIKASIKAN"
                          ? "bg-[#E6F4EA] text-[#14532D] border-[#166534]"
                          : "bg-[#FAF0F0] text-[#9E1B1B] border-[#9E1B1B]"
                      }`}
                    >
                      {r.status}
                    </button>
                  </div>
                  <p className="font-semibold text-sm">{r.topic}</p>
                  <p className="text-xs text-[#3F3D39] line-clamp-3">
                    {r.official_response_text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Unanswered Questions Management */}
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#9E1B1B]" />
              Kelola Pertanyaan Terbuka ({questions.length})
            </h2>

            <form
              onSubmit={handleCreateQuestion}
              className="bg-white border-2 border-[#141414] p-4 space-y-2.5"
            >
              <p className="font-data text-[11px] font-bold uppercase text-[#9E1B1B]">
                + Tambah Pertanyaan Publik Baru
              </p>
              <input
                type="text"
                required
                minLength={15}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Rumusan pertanyaan terbuka *"
                className="w-full px-3 py-2 border border-[#141414] bg-[#F7F6F2] text-xs"
              />
              <input
                type="text"
                required
                minLength={10}
                value={qContext}
                onChange={(e) => setQContext(e.target.value)}
                placeholder="Konteks fakta / angka *"
                className="w-full px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={qAddressed}
                  onChange={(e) => setQAddressed(e.target.value)}
                  placeholder="Ditujukan kepada *"
                  className="px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-xs"
                />
                <input
                  type="text"
                  required
                  value={qCategory}
                  onChange={(e) => setQCategory(e.target.value)}
                  placeholder="Kategori *"
                  className="px-3 py-2 border border-[#D6D1C6] bg-[#F7F6F2] text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#141414] text-white font-data text-xs font-bold uppercase"
              >
                Tambahkan ke Daftar
              </button>
            </form>

            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-[#D6D1C6] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-data text-xs font-bold">
                      {q.code} — {q.addressed_to}
                    </span>
                    <select
                      value={q.status}
                      onChange={(e) =>
                        handleUpdateQuestionStatus(
                          q,
                          e.target.value as QuestionStatus
                        )
                      }
                      aria-label={`Status pertanyaan ${q.code}`}
                      className={`px-2 py-0.5 font-data text-[10px] font-bold border ${getQuestionStatusStyles(
                        q.status
                      )}`}
                    >
                      <option value="BELUM DIJAWAB">BELUM DIJAWAB</option>
                      <option value="DIJAWAB PARSIAL">DIJAWAB PARSIAL</option>
                      <option value="KLARIFIKASI TERCATAT">
                        KLARIFIKASI TERCATAT
                      </option>
                    </select>
                  </div>
                  <p className="text-sm font-semibold">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
