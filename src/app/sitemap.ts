import type { MetadataRoute } from "next";
import {
  listArticles,
  listCategories,
  listDocuments,
  listEntities,
} from "@/lib/db/queries";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://isan7777.github.io/bongkar-danantara";
  const staticRoutes = [
    "",
    "/investigasi",
    "/database",
    "/dokumen",
    "/dokumen/bandingkan",
    "/keuangan",
    "/timeline",
    "/lapor",
    "/hak-jawab",
    "/metodologi",
    "/cari",
  ].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));

  const categories = listCategories().map((c) => ({
    url: `${base}/kategori/${c.slug}`,
    lastModified: new Date(),
  }));

  const articles = listArticles().map((a) => ({
    url: `${base}/investigasi/${a.slug}`,
    lastModified: new Date(a.updated_at),
  }));

  const entities = listEntities().map((e) => ({
    url: `${base}/database/${e.slug}`,
    lastModified: new Date(e.updated_at),
  }));

  const documents = listDocuments().map((d) => ({
    url: `${base}/dokumen/${d.id}`,
    lastModified: new Date(d.published_date),
  }));

  return [
    ...staticRoutes,
    ...categories,
    ...articles,
    ...entities,
    ...documents,
  ];
}
