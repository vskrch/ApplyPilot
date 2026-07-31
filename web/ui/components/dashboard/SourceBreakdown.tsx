"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SourceBreakdownProps {
  data: { site: string; total: number; high_fit: number; avg_score: number }[];
}

export function SourceBreakdown({ data }: SourceBreakdownProps) {
  const chartData = data.slice(0, 7).map((d) => ({
    site: d.site.length > 14 ? d.site.slice(0, 14) + "…" : d.site,
    Total: d.total,
    "High Fit (7+)": d.high_fit,
  }));

  return (
    <div className="card bg-[#12161f] border-[#2a3447] p-5 rounded-xl">
      <h3 className="text-sm font-bold text-slate-100 mb-4 border-b border-[#2a3447] pb-3">
        Job Source Performance Breakdown
      </h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#2a3447" }} />
            <YAxis dataKey="site" type="category" width={95} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#181d28",
                border: "1px solid #2a3447",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="Total" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="High Fit (7+)" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
