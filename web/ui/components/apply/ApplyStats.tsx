interface ApplyStatsProps {
  applied: number;
  failed: number;
  cost: number;
}

export function ApplyStats({ applied, failed, cost }: ApplyStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="card text-center">
        <div className="text-3xl font-bold text-[var(--success)]">{applied}</div>
        <div className="text-sm text-[var(--text-muted)] uppercase mt-1">Total Applied</div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-[var(--danger)]">{failed}</div>
        <div className="text-sm text-[var(--text-muted)] uppercase mt-1">Total Failed</div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-[var(--text-primary)] font-mono">
          ${cost.toFixed(4)}
        </div>
        <div className="text-sm text-[var(--text-muted)] uppercase mt-1">Total Cost</div>
      </div>
    </div>
  );
}
