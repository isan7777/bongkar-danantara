import type {
  ClaimType,
  ModerationStatus,
  QuestionStatus,
  VerificationStatus,
} from "@/types/domain";

export function formatIndonesianDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTrillionIdr(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Tidak dipublikasikan";
  }
  return `Rp${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)} T`;
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function getStatusStyles(status: VerificationStatus): {
  bg: string;
  text: string;
  border: string;
  label: string;
  description: string;
} {
  switch (status) {
    case "TERBUKTI":
      return {
        bg: "bg-[#E6F4EA]",
        text: "text-[#14532D]",
        border: "border-[#166534]",
        label: "TERBUKTI",
        description:
          "Fakta hukum atau angka yang diverifikasi langsung dari dokumen resmi negara, putusan pengadilan, atau laporan keuangan teraudit.",
      };
    case "TERDOKUMENTASI":
      return {
        bg: "bg-[#E8EFF7]",
        text: "text-[#163A5F]",
        border: "border-[#163A5F]",
        label: "TERDOKUMENTASI",
        description:
          "Catatan peristiwa, jabatan, relasi, atau angka yang terekam secara eksplisit dalam dokumen publik atau pengumuman resmi.",
      };
    case "DUGAAN":
      return {
        bg: "bg-[#FDF2E9]",
        text: "text-[#9A3412]",
        border: "border-[#9A3412]",
        label: "DUGAAN",
        description:
          "Indikasi risiko, potensi benturan kepentingan, atau celah tata kelola yang memerlukan pembuktian dan audit lanjutan.",
      };
    case "BELUM TERVERIFIKASI":
      return {
        bg: "bg-[#EFECE6]",
        text: "text-[#3F3D39]",
        border: "border-[#57534E]",
        label: "BELUM TERVERIFIKASI",
        description:
          "Klaim publik, angka proyeksi, atau informasi yang belum dilengkapi rincian dokumen primer yang dapat diaudit publik.",
      };
    case "BANTAHAN":
      return {
        bg: "bg-[#F3E8FF]",
        text: "text-[#581C87]",
        border: "border-[#581C87]",
        label: "BANTAHAN",
        description:
          "Tanggapan resmi, klarifikasi, atau hak jawab dari Danantara, pemerintah, atau pihak terkait.",
      };
  }
}

export function getClaimTypeStyles(claimType: ClaimType): {
  label: string;
  badgeClass: string;
  borderClass: string;
} {
  switch (claimType) {
    case "FAKTA":
      return {
        label: "FAKTA TERDOKUMENTASI",
        badgeClass: "bg-[#163A5F] text-[#F7F6F2]",
        borderClass: "border-l-[#163A5F]",
      };
    case "ANALISIS":
      return {
        label: "ANALISIS REDAKSI",
        badgeClass: "bg-[#1F1E1C] text-[#F7F6F2]",
        borderClass: "border-l-[#1F1E1C]",
      };
    case "DUGAAN":
      return {
        label: "DUGAAN & RISIKO TATA KELOLA",
        badgeClass: "bg-[#9E1B1B] text-[#F7F6F2]",
        borderClass: "border-l-[#9E1B1B]",
      };
    case "PERTANYAAN":
      return {
        label: "PERTANYAAN BELUM TERJAWAB",
        badgeClass: "bg-[#7A1212] text-[#F7F6F2]",
        borderClass: "border-l-[#7A1212]",
      };
    case "KONTEKS":
      return {
        label: "KONTEKS REGULASI",
        badgeClass: "bg-[#4A4742] text-[#F7F6F2]",
        borderClass: "border-l-[#4A4742]",
      };
  }
}

export function getQuestionStatusStyles(status: QuestionStatus): string {
  switch (status) {
    case "BELUM DIJAWAB":
      return "bg-[#FBF0F0] text-[#9E1B1B] border-[#9E1B1B]";
    case "DIJAWAB PARSIAL":
      return "bg-[#FDF2E9] text-[#9A3412] border-[#9A3412]";
    case "KLARIFIKASI TERCATAT":
      return "bg-[#E8EFF7] text-[#163A5F] border-[#163A5F]";
  }
}

export function getModerationStatusLabel(status: ModerationStatus): {
  label: string;
  style: string;
} {
  switch (status) {
    case "DITERIMA":
      return {
        label: "Diterima — Antrean Verifikasi",
        style: "bg-[#EFECE6] text-[#1F1E1C] border-[#78716C]",
      };
    case "VERIFIKASI_AWAL":
      return {
        label: "Verifikasi Awal Dokumen",
        style: "bg-[#E8EFF7] text-[#163A5F] border-[#163A5F]",
      };
    case "INVESTIGASI_LANJUT":
      return {
        label: "Investigasi Lanjutan",
        style: "bg-[#FDF2E9] text-[#9A3412] border-[#9A3412]",
      };
    case "TERVERIFIKASI":
      return {
        label: "Terverifikasi Redaksi",
        style: "bg-[#E6F4EA] text-[#14532D] border-[#166534]",
      };
    case "DITOLAK":
      return {
        label: "Tidak Memenuhi Standar Bukti",
        style: "bg-[#FBF0F0] text-[#9E1B1B] border-[#9E1B1B]",
      };
    case "DIARSIPKAN":
      return {
        label: "Diarsipkan",
        style: "bg-[#E7E5E4] text-[#44403C] border-[#78716C]",
      };
  }
}
