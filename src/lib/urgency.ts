export type UrgencyTier = "overdue" | "soon" | "ok";

export function daysUntil(dateStr: string, today = new Date()): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ms = target.getTime() - now.getTime();
  return Math.round(ms / 86400000);
}

export function urgencyTier(days: number): UrgencyTier {
  if (days < 0) return "overdue";
  if (days <= 1) return "soon";
  return "ok";
}

export function urgencyColors(tier: UrgencyTier) {
  switch (tier) {
    case "overdue":
      return { fg: "var(--color-red)", bg: "var(--color-red-bg)" };
    case "soon":
      return { fg: "#9a7a16", bg: "#f4e9c2" };
    case "ok":
      return { fg: "var(--color-green)", bg: "var(--color-green-bg)" };
  }
}

export function urgencyLabel(days: number): string {
  if (days < 0) return days === -1 ? "Overdue" : `${-days}d over`;
  if (days === 0) return "Today";
  if (days === 1) return "1d";
  return `${days}d`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
