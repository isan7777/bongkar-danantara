import path from "node:path";
import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export",
        trailingSlash: true,
        basePath,
        assetPrefix: basePath ? `${basePath}/` : undefined,
      }
    : {
        serverExternalPackages: ["node:sqlite"],
        outputFileTracingRoot: path.join(__dirname),
      }),
  images: {
    unoptimized: true,
  },
  ...(isGithubPages
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                {
                  key: "Permissions-Policy",
                  value:
                    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
                },
                { key: "X-DNS-Prefetch-Control", value: "off" },
              ],
            },
            {
              source: "/documents/:path*",
              headers: [
                { key: "Content-Type", value: "application/pdf" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
