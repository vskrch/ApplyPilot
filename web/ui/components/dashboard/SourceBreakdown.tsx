"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SourceBreakdownProps {
  bySite: [string, number][];
}

export function SourceBreakdown({ bySite }: SourceBreakdownProps) {
  const data = bySite.slice(0, 8).map(([site, count], i) => ({
    site: site.length > 15 ? site.slice(0, 15) + "…" : site,
    count,
    fill: `hsl(${(i * 45) % 360}, 70%, 60%)`,
  }));

  return (
    <div className="card" style={{ background: "var(--bg-card)" }}>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Source Breakdown
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              dataKey="site"
              type="category"
              width={100}
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
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
