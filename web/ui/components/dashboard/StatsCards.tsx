import { Briefcase, FileText, TrendingUp, CheckCircle, Send } from "lucide-react";

interface StatsCardsProps {
  stats: Record<string, unknown>;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Jobs",
      value: (stats.total as number) || 0,
      icon: Briefcase,
      color: "var(--accent)",
    },
    {
      label: "Enriched",
      value: (stats.with_description as number) || 0,
      icon: FileText,
      color: "var(--success)",
    },
    {
      label: "Scored",
      value: (stats.scored as number) || 0,
      icon: TrendingUp,
      color: "var(--warning)",
    },
    {
      label: "Strong Fit (7+)",
      value:
        (stats.score_distribution as [number, number][])?.reduce(
          (acc, [score, count]) => (score >= 7 ? acc + count : acc),
          0
        ) || 0,
      icon: CheckCircle,
      color: "var(--purple)",
    },
    {
      label: "Applied",
      value: (stats.applied as number) || 0,
      icon: Send,
      color: "var(--success)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="card flex items-center gap-4"
            style={{ background: "var(--bg-card)" }}
          >
            <div
              className="p-3 rounded-lg"
              style={{ background: `${card.color}20`, color: card.color }}
            >
              <Icon size={20} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {card.value.toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
