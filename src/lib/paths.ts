export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

export function withBasePath(assetPath: string): string {
  if (!assetPath) return assetPath;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  if (!BASE_PATH) return normalized;
  if (normalized.startsWith(`${BASE_PATH}/`) || normalized === BASE_PATH) {
    return normalized;
  }
  return `${BASE_PATH}${normalized}`;
}
