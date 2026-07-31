"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/Header";

interface ScoreDist {
  score: number;
  count: number;
}

interface SiteStat {
  site: string;
  total: number;
  high_fit: number;
  avg_score: number;
}

interface TimelinePoint {
  date: string;
  discovered: number;
  scored: number;
  applied: number;
}

export default function AnalyticsPage() {
  const [scoreDist, setScoreDist] = useState<ScoreDist[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStat[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [dist, sites, tl, st] = await Promise.all([
          api.getScoreDistribution(),
          api.getStatsBySite(),
          api.getTimeline(),
          api.getStats(),
        ]);
        setScoreDist(dist);
        setSiteStats(sites);
        setTimeline(tl);
        setStats(st);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const funnelData = [
    { stage: "Discovered", count: (stats.total as number) || 0 },
    { stage: "Enriched", count: (stats.with_description as number) || 0 },
    { stage: "Scored", count: (stats.scored as number) || 0 },
    {
      stage: "High Fit",
      count:
        scoreDist
          .filter((d) => d.score >= 7)
          .reduce((acc, d) => acc + d.count, 0) || 0,
    },
    { stage: "Tailored", count: (stats.tailored as number) || 0 },
    { stage: "Applied", count: (stats.applied as number) || 0 },
  ];

  const applyPieData = [
    {
      name: "Applied",
      value: (stats.applied as number) || 0,
      fill: "var(--success)",
    },
    {
      name: "Failed",
      value: (stats.apply_errors as number) || 0,
      fill: "var(--danger)",
    },
  ];

  const scoreData = scoreDist.map((d) => ({
    ...d,
    fill:
      scoreFilter !== null && d.score === scoreFilter
        ? "var(--accent)"
        : d.score >= 7
        ? "var(--success)"
        : d.score >= 5
        ? "var(--warning)"
        : "var(--danger)",
  }));

  const siteData = siteStats.slice(0, 10).map((s) => ({
    site: s.site.length > 15 ? s.site.slice(0, 15) + "…" : s.site,
    total: s.total,
    highFit: s.high_fit,
  }));

  const timelineData = timeline.map((t) => ({
    ...t,
    date: new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div>
      <Header
        title="Analytics"
        subtitle="Deep dive into pipeline performance"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card" style={{ background: "var(--bg-card)" }}>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Score Distribution
          </h3>
          {scoreFilter !== null && (
            <p className="text-sm text-[var(--accent)] mb-2">
              Filtered: Score {scoreFilter} —{" "}
              <button
                className="underline"
                onClick={() => setScoreFilter(null)}
              >
                Clear
              </button>
            </p>
          )}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
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
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(entry) =>
                    setScoreFilter(
                      scoreFilter === entry.score ? null : entry.score
                    )
                  }
                >
                  {scoreData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ background: "var(--bg-card)" }}>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Source Performance
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={siteData}
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
                <Bar
                  dataKey="total"
                  stackId="a"
                  fill="var(--accent)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="highFit"
                  stackId="a"
                  fill="var(--success)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded"
                style={{ background: "var(--accent)" }}
              />{" "}
              Total
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded"
                style={{ background: "var(--success)" }}
              />{" "}
              High Fit (7+)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card" style={{ background: "var(--bg-card)" }}>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Discovery Timeline
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
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
                <Line
                  type="monotone"
                  dataKey="discovered"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="scored"
                  stroke="var(--warning)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="applied"
                  stroke="var(--success)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span
                className="w-4 h-0.5"
                style={{ background: "var(--accent)" }}
              />{" "}
              Discovered
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-4 h-0.5"
                style={{ background: "var(--warning)" }}
              />{" "}
              Scored
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-4 h-0.5"
                style={{ background: "var(--success)" }}
              />{" "}
              Applied
            </span>
          </div>
        </div>

        <div className="card" style={{ background: "var(--bg-card)" }}>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Apply Results
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={applyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {applyPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "var(--text-secondary)" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card mb-6" style={{ background: "var(--bg-card)" }}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Pipeline Funnel
        </h3>
        <div className="flex items-end gap-4 h-48">
          {funnelData.map((item, i) => {
            const maxCount = funnelData[0]?.count || 1;
            const height = Math.max(
              4,
              (item.count / maxCount) * 100
            );
            const colors = [
              "var(--accent)",
              "var(--accent)",
              "var(--warning)",
              "var(--success)",
              "var(--purple)",
              "var(--success)",
            ];
            return (
              <div
                key={item.stage}
                className="flex-1 flex flex-col items-center justify-end"
              >
                <span className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  {item.count.toLocaleString()}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${height}%`,
                    background: colors[i],
                    opacity: 0.85,
                  }}
                />
                <span className="text-xs text-[var(--text-secondary)] mt-2">
                  {item.stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
