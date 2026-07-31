"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/ws";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PipelineFlow } from "@/components/dashboard/PipelineFlow";
import { ScoreChart } from "@/components/dashboard/ScoreChart";
import { SourceBreakdown } from "@/components/dashboard/SourceBreakdown";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Play, Zap, Briefcase, Settings, ArrowRight, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [scoreDist, setScoreDist] = useState<{ score: number; count: number }[]>([]);
  const [siteStats, setSiteStats] = useState<{ site: string; total: number; high_fit: number; avg_score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [st, dist, sites] = await Promise.all([
        api.getStats().catch(() => ({})),
        api.getScoreDistribution().catch(() => []),
        api.getStatsBySite().catch(() => []),
      ]);
      setStats(st);
      setScoreDist(dist);
      setSiteStats(sites);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to live pipeline events for real-time dashboard updates
  useWebSocket("/ws/pipeline", (event) => {
    if (event.type === "stats_update" && event.stats) {
      setStats(event.stats as Record<string, unknown>);
    } else if (event.type === "pipeline_complete" || event.type === "job_scored") {
      fetchDashboardData();
    }
  });

  return (
    <div className="p-6 bg-[#0a0c10] min-h-screen space-y-6">
      {/* SaaS Dashboard Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#2a3447] gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Control Center Dashboard
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Pipeline Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual monitoring for discovery, AI fit scoring, resume tailoring, and auto-apply submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="btn btn-ghost btn-sm border-[#2a3447] text-slate-300"
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-400" : ""} />
            Refresh
          </button>
          <Link href="/pipeline" className="btn btn-primary btn-sm">
            <Play size={14} /> Run Pipeline
          </Link>
          <Link href="/apply" className="btn btn-primary btn-sm bg-purple-600 hover:bg-purple-700 border-none">
            <Zap size={14} /> Auto-Apply
          </Link>
        </div>
      </header>

      {/* Top Metric Cards */}
      <StatsCards stats={stats} />

      {/* Pipeline Flow Visualization */}
      <PipelineFlow stats={stats} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreChart data={scoreDist} />
        <SourceBreakdown data={siteStats} />
      </div>

      {/* Bottom Activity & Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        <div className="card bg-[#12161f] border-[#2a3447] space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-[#2a3447] pb-3">
            Quick Navigation
          </h3>
          <div className="space-y-2">
            <Link
              href="/jobs"
              className="flex items-center justify-between p-3 rounded-lg bg-[#181d28] border border-[#2a3447] hover:border-blue-500/50 transition-all text-xs font-medium text-slate-200 group"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase size={16} className="text-blue-400" />
                <span>Manage Jobs Database</span>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/pipeline"
              className="flex items-center justify-between p-3 rounded-lg bg-[#181d28] border border-[#2a3447] hover:border-blue-500/50 transition-all text-xs font-medium text-slate-200 group"
            >
              <div className="flex items-center gap-2.5">
                <Play size={16} className="text-emerald-400" />
                <span>Configure & Run Stages</span>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/apply"
              className="flex items-center justify-between p-3 rounded-lg bg-[#181d28] border border-[#2a3447] hover:border-blue-500/50 transition-all text-xs font-medium text-slate-200 group"
            >
              <div className="flex items-center gap-2.5">
                <Zap size={16} className="text-purple-400" />
                <span>Launch Auto-Apply Workers</span>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/config"
              className="flex items-center justify-between p-3 rounded-lg bg-[#181d28] border border-[#2a3447] hover:border-blue-500/50 transition-all text-xs font-medium text-slate-200 group"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={16} className="text-amber-400" />
                <span>Profile & Search Settings</span>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}