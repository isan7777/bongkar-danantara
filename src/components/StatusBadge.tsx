import { getStatusStyles } from "@/lib/format";
import type { VerificationStatus } from "@/types/domain";

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

export function StatusBadge({
  status,
  size = "sm",
  showTooltip = true,
}: StatusBadgeProps) {
  const styles = getStatusStyles(status);
  const sizeClass =
    size === "md"
      ? "px-2.5 py-1 text-[11px] tracking-[0.08em]"
      : "px-2 py-0.5 text-[10px] tracking-[0.08em]";

  return (
    <span
      title={showTooltip ? styles.description : undefined}
      className={`inline-flex items-center font-data font-semibold uppercase border ${styles.bg} ${styles.text} ${styles.border} ${sizeClass} leading-none whitespace-nowrap`}
    >
      {styles.label}
    </span>
  );
}
