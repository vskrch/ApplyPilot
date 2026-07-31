"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScoreChartProps {
  distribution: [number, number][];
}

export function ScoreChart({ distribution }: ScoreChartProps) {
  const data = distribution.map(([score, count]) => ({
    score,
    count,
    fill: score >= 7 ? "var(--success)" : score >= 5 ? "var(--warning)" : "var(--danger)",
  }));

  return (
    <div className="card" style={{ background: "var(--bg-card)" }}>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Score Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="score"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
