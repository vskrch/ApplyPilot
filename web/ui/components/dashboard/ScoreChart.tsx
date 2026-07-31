"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScoreChartProps {
  data: { score: number; count: number }[];
}

export function ScoreChart({ data }: ScoreChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    fill: d.score >= 7 ? "#10b981" : d.score >= 5 ? "#f59e0b" : "#ef4444",
  }));

  return (
    <div className="card bg-[#12161f] border-[#2a3447] p-5 rounded-xl">
      <h3 className="text-sm font-bold text-slate-100 mb-4 border-b border-[#2a3447] pb-3">
        Score Distribution (1 - 10 Fit Rating)
      </h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="score"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#2a3447" }}
              tickLine={{ stroke: "#2a3447" }}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#2a3447" }}
              tickLine={{ stroke: "#2a3447" }}
            />
            <Tooltip
              contentStyle={{
                background: "#181d28",
                border: "1px solid #2a3447",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
