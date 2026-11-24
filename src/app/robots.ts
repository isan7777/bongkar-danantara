import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://isan7777.github.io/bongkar-danantara";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/reports", "/api/auth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
