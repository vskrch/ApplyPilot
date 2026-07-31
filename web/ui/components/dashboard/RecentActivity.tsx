import { formatDateTime } from "@/lib/utils";

interface RecentActivityProps {
  events?: Array<{
    type: string;
    timestamp?: string;
    message?: string;
    url?: string;
    title?: string;
  }>;
}

export function RecentActivity({ events = [] }: RecentActivityProps) {
  const recentEvents = events.slice(-20).reverse();

  if (recentEvents.length === 0) {
    return (
      <div className="card" style={{ background: "var(--bg-card)" }}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Recent Activity
        </h3>
        <p className="text-[var(--text-secondary)] text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: "var(--bg-card)" }}>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentEvents.map((event, i) => (
          <div
            key={i}
            className="flex items-start gap-3 pb-3 border-b border-[var(--border)] last:border-0"
          >
            <div
              className={`w-2 h-2 rounded-full mt-1.5 ${
                event.type.includes("error")
                  ? "bg-[var(--danger)]"
                  : event.type.includes("complete")
                  ? "bg-[var(--success)]"
                  : "bg-[var(--accent)]"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">
                {event.title || event.type}
              </p>
              {event.message && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {event.message}
                </p>
              )}
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {formatDateTime(event.timestamp || null)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
