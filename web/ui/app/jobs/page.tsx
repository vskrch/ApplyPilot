"use client";

import { useEffect } from "react";
import { useJobStore } from "@/stores/jobs";
import JobFilters from "@/components/jobs/JobFilters";
import JobTable from "@/components/jobs/JobTable";
import JobDetail from "@/components/jobs/JobDetail";
import { RefreshCw } from "lucide-react";

export default function JobsPage() {
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const total = useJobStore((s) => s.total);
  const loading = useJobStore((s) => s.loading);

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0c10]">
      <JobFilters />
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="border-b border-[#2a3447] bg-[#12161f] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Jobs Control Center
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {total} Total Jobs
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter, score, inspect tailored resumes, and manage application pipeline targets
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm border-[#2a3447] text-slate-300"
            onClick={() => fetchJobs()}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-400" : ""} />
            Refresh
          </button>
        </header>
        <div className="flex-1 overflow-hidden">
          <JobTable />
        </div>
      </main>
      <JobDetail />
    </div>
  );
}
