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
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Enriched",
      value: (stats.with_description as number) || 0,
      icon: FileText,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Scored",
      value: (stats.scored as number) || 0,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Strong Fit (7+)",
      value: (stats.high_fit as number) || 0,
      icon: CheckCircle,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Applied",
      value: (stats.applied as number) || 0,
      icon: Send,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="card bg-[#12161f] border-[#2a3447] flex items-center gap-3.5 p-4 rounded-xl shadow-sm"
          >
            <div className={`p-2.5 rounded-lg border ${card.bg} ${card.color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">{card.label}</p>
              <p className="text-xl font-bold text-slate-100 tracking-tight">
                {card.value.toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
