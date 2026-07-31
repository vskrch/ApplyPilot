"use client";

import { scoreColor } from "@/lib/utils";

export default function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[var(--text-muted)] text-xs">—</span>;

  const colorClass = scoreColor(score);

  return (
    <span className={`score-badge ${colorClass}`}>
      {score}
    </span>
  );
}
