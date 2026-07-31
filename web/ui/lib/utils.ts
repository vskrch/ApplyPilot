export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function scoreColor(score: number | null): string {
  if (score === null) return "";
  if (score >= 7) return "score-high";
  if (score >= 5) return "score-mid";
  return "score-low";
}

export function statusBadge(status: string | null): string {
  if (!status) return "badge-gray";
  if (status === "applied") return "badge-green";
  if (status === "failed") return "badge-red";
  if (status === "in_progress") return "badge-yellow";
  if (status === "manual") return "badge-blue";
  return "badge-gray";
}

export function clsx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
