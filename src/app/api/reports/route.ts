import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, getUploadsDir } from "@/lib/db/client";
import { listWhistleblowerReports } from "@/lib/db/queries";
import { getAdminSession, hashSecret } from "@/lib/auth";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  checkRateLimit,
  computeSha256,
  generateAccessPin,
  generateTrackingCode,
  getClientIp,
  validateUploadMagicBytes,
} from "@/lib/security";

const reportSchema = z.object({
  anonymity_mode: z.enum(["ANONIM", "SAMARAN", "TERVERIFIKASI_RAHASIA"]),
  reporter_alias: z.string().trim().max(120).optional().nullable(),
  contact_channel: z.string().trim().max(160).optional().nullable(),
  category: z.string().trim().min(3).max(120),
  subject_entities: z.string().trim().min(3).max(260),
  incident_period: z.string().trim().min(3).max(120),
  estimated_value: z.string().trim().max(120).optional().nullable(),
  title: z.string().trim().min(10).max(220),
  chronology: z.string().trim().min(30).max(12000),
  evidence_description: z.string().trim().max(2000).optional().nullable(),
  risk_level: z.enum(["RENDAH", "SEDANG", "TINGGI"]).default("SEDANG"),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya redaksi terautentikasi." },
      { status: 401 }
    );
  }
  const reports = listWhistleblowerReports();
  return NextResponse.json({ reports, total: reports.length });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`report:${ip}`, 8, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Batas pengiriman sementara tercapai. Silakan coba lagi dalam ${limit.retryAfterSec} detik.`,
      },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format formulir tidak valid." },
      { status: 400 }
    );
  }

  const parsed = reportSchema.safeParse({
    anonymity_mode: formData.get("anonymity_mode"),
    reporter_alias: formData.get("reporter_alias") || null,
    contact_channel: formData.get("contact_channel") || null,
    category: formData.get("category"),
    subject_entities: formData.get("subject_entities"),
    incident_period: formData.get("incident_period"),
    estimated_value: formData.get("estimated_value") || null,
    title: formData.get("title"),
    chronology: formData.get("chronology"),
    evidence_description: formData.get("evidence_description") || null,
    risk_level: formData.get("risk_level") || "SEDANG",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Mohon lengkapi semua kolom wajib dengan informasi yang memadai.",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  let attachmentOriginalName: string | null = null;
  let attachmentStoredName: string | null = null;
  let attachmentMime: string | null = null;
  let attachmentSizeBytes: number | null = null;
  let attachmentSha256: string | null = null;

  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Ukuran lampiran melebihi batas maksimum 10 MB." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error:
            "Format file tidak didukung. Gunakan PDF, PNG, JPG, TXT, atau CSV.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateUploadMagicBytes(buffer, ext)) {
      return NextResponse.json(
        {
          error:
            "Validasi isi file gagal. Pastikan file sesuai dengan ekstensinya dan tidak rusak.",
        },
        { status: 400 }
      );
    }

    const storedName = `${crypto.randomUUID()}${ext}`;
    const uploadsDir = getUploadsDir();
    fs.writeFileSync(path.join(uploadsDir, storedName), buffer);

    attachmentOriginalName = path.basename(file.name).slice(0, 140);
    attachmentStoredName = storedName;
    attachmentMime = file.type || "application/octet-stream";
    attachmentSizeBytes = buffer.length;
    attachmentSha256 = computeSha256(buffer);
  }

  const data = parsed.data;
  const id = `TIP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const trackingCode = generateTrackingCode();
  const accessPin = generateAccessPin();
  const pinHash = hashSecret(accessPin);
  const now = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO whistleblower_reports (
      id, tracking_code, access_pin_hash, anonymity_mode, reporter_alias,
      contact_channel, category, subject_entities, incident_period,
      estimated_value, title, chronology, evidence_description,
      attachment_original_name, attachment_stored_name, attachment_mime,
      attachment_size_bytes, attachment_sha256, risk_level,
      moderation_status, editor_public_note, editor_internal_note,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DITERIMA', ?, NULL, ?, ?)`
  ).run(
    id,
    trackingCode,
    pinHash,
    data.anonymity_mode,
    data.anonymity_mode === "ANONIM" ? null : data.reporter_alias ?? null,
    data.anonymity_mode === "ANONIM" ? null : data.contact_channel ?? null,
    data.category,
    data.subject_entities,
    data.incident_period,
    data.estimated_value ?? null,
    data.title,
    data.chronology,
    data.evidence_description ?? null,
    attachmentOriginalName,
    attachmentStoredName,
    attachmentMime,
    attachmentSizeBytes,
    attachmentSha256,
    data.risk_level,
    "Laporan telah masuk antrean verifikasi redaksi. Tidak ada informasi yang dipublikasikan sebelum verifikasi independen selesai.",
    now,
    now
  );

  return NextResponse.json(
    {
      tracking_code: trackingCode,
      access_pin: accessPin,
      attachment_sha256: attachmentSha256,
      moderation_status: "DITERIMA",
      notice:
        "Simpan Kode Pelacakan dan PIN Akses di tempat aman. PIN tidak disimpan dalam bentuk teks asli dan tidak dapat dipulihkan jika hilang.",
    },
    { status: 201 }
  );
}
