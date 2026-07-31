"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";
import ScoreBadge from "@/components/jobs/ScoreBadge";
import { Clock } from "lucide-react";

interface RecentJob {
  url: string;
  title: string;
  site: string;
  fit_score: number | null;
  discovered_at: string;
  apply_status: string | null;
}

export function RecentActivity() {
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await api.getJobs({ limit: 6, sort_by: "discovered_at", sort_dir: "desc" });
        setRecentJobs(res.jobs as unknown as RecentJob[]);
      } catch {
        setRecentJobs([]);
      }
    }
    loadRecent();
  }, []);

  return (
    <div className="card bg-[#12161f] border-[#2a3447] p-5 rounded-xl">
      <h3 className="text-sm font-bold text-slate-100 mb-4 border-b border-[#2a3447] pb-3 flex items-center justify-between">
        <span>Recent Pipeline Job Activity</span>
        <Clock size={15} className="text-slate-400" />
      </h3>
      <div className="space-y-2.5">
        {recentJobs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No recent job activity recorded.</p>
        ) : (
          recentJobs.map((job) => (
            <div
              key={job.url}
              className="flex items-center justify-between p-3 rounded-lg bg-[#181d28] border border-[#2a3447] text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ScoreBadge score={job.fit_score} />
                <div className="truncate">
                  <p className="font-semibold text-slate-200 truncate">{job.title || "Untitled Role"}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{job.site || "Direct"} · Discovered {formatDate(job.discovered_at)}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                {job.apply_status || "Discovered"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
