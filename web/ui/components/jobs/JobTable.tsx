"use client";

import { useJobStore } from "@/stores/jobs";
import { formatDate, statusBadge, truncate } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";
import { ChevronLeft, ChevronRight, MoreHorizontal, CheckCircle2, XCircle, Trash2, ExternalLink, Eye } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function JobTable() {
  const jobs = useJobStore((s) => s.jobs);
  const total = useJobStore((s) => s.total);
  const pages = useJobStore((s) => s.pages);
  const filters = useJobStore((s) => s.filters);
  const loading = useJobStore((s) => s.loading);
  const setFilters = useJobStore((s) => s.setFilters);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const selectJob = useJobStore((s) => s.selectJob);
  const markJob = useJobStore((s) => s.markJob);
  const deleteJob = useJobStore((s) => s.deleteJob);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePage = (page: number) => {
    setFilters({ page });
    fetchJobs();
  };

  const handleMarkApplied = async (url: string) => {
    setOpenMenu(null);
    try {
      await markJob(url, "applied");
      toast.success("Job marked as applied");
    } catch {
      toast.error("Failed to mark job as applied");
    }
  };

  const handleMarkFailed = async (url: string) => {
    setOpenMenu(null);
    try {
      await markJob(url, "failed", "Manual override");
      toast.error("Job marked as failed");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (url: string) => {
    setOpenMenu(null);
    try {
      await deleteJob(url);
      toast.info("Job deleted from pipeline");
    } catch {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12161f]">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#0a0c10] border-b border-[#2a3447] z-10 shadow-sm">
            <tr>
              <th className="table-header p-3 w-16 text-center">Score</th>
              <th className="table-header p-3">Role Title</th>
              <th className="table-header p-3 hidden md:table-cell">Source / Company</th>
              <th className="table-header p-3 hidden lg:table-cell">Location</th>
              <th className="table-header p-3 hidden xl:table-cell">Compensation</th>
              <th className="table-header p-3">Pipeline Stage</th>
              <th className="table-header p-3 hidden sm:table-cell">Discovered</th>
              <th className="table-header p-3 w-12 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2636]">
            {loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 text-sm">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
                  Loading jobs...
                </td>
              </tr>
            )}
            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-16 text-center text-slate-400 text-sm">
                  No matching jobs found in pipeline database.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr
                key={job.url}
                className="table-row cursor-pointer transition-colors"
                onClick={() => selectJob(job.url)}
              >
                <td className="p-3 text-center">
                  <ScoreBadge score={job.fit_score} />
                </td>
                <td className="p-3">
                  <div className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 leading-snug">
                    {truncate(job.title || "Untitled Role", 65)}
                  </div>
                  <div className="text-[11px] text-slate-400 md:hidden mt-0.5">
                    {job.site || "Direct"}
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span className="text-xs text-slate-300 font-medium">
                    {job.site || "—"}
                  </span>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <span className="text-xs text-slate-400">
                    {truncate(job.location || "Remote / Unspecified", 28)}
                  </span>
                </td>
                <td className="p-3 hidden xl:table-cell">
                  <span className="text-xs text-slate-400">
                    {job.salary || "—"}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`badge ${statusBadge(job.apply_status)}`}>
                    {job.apply_status || "Discovered"}
                  </span>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <span className="text-xs text-slate-400 font-mono">
                    {formatDate(job.discovered_at)}
                  </span>
                </td>
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left" ref={openMenu === job.url ? menuRef : undefined}>
                    <button
                      className="btn btn-ghost btn-sm p-1 hover:bg-[#222938]"
                      onClick={() => setOpenMenu(openMenu === job.url ? null : job.url)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenu === job.url && (
                      <div className="absolute right-0 top-8 z-30 bg-[#181d28] border border-[#2a3447] rounded-xl shadow-2xl py-1 min-w-44 text-xs font-medium">
                        <button
                          className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#222938] flex items-center gap-2"
                          onClick={() => { selectJob(job.url); setOpenMenu(null); }}
                        >
                          <Eye size={14} className="text-blue-400" />
                          View Details & Resume
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#222938] flex items-center gap-2"
                          onClick={() => handleMarkApplied(job.url)}
                        >
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Mark as Applied
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#222938] flex items-center gap-2"
                          onClick={() => handleMarkFailed(job.url)}
                        >
                          <XCircle size={14} className="text-amber-400" />
                          Mark as Failed
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#222938] flex items-center gap-2"
                          onClick={() => { window.open(job.url, "_blank"); setOpenMenu(null); }}
                        >
                          <ExternalLink size={14} className="text-slate-400" />
                          Open Application Link
                        </button>
                        <div className="my-1 border-t border-[#2a3447]" />
                        <button
                          className="w-full text-left px-3 py-2 text-rose-400 hover:bg-[#222938] flex items-center gap-2"
                          onClick={() => handleDelete(job.url)}
                        >
                          <Trash2 size={14} />
                          Delete Job
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-[#2a3447] bg-[#0d1017]">
          <span className="text-xs text-slate-400">
            Total {total} jobs · Page {filters.page} of {pages}
          </span>
          <div className="flex gap-1">
            <button
              className="btn btn-ghost btn-sm"
              disabled={filters.page <= 1}
              onClick={() => handlePage(filters.page - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(filters.page - 2, pages - 4));
              const p = start + i;
              if (p > pages) return null;
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${p === filters.page ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => handlePage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn btn-ghost btn-sm"
              disabled={filters.page >= pages}
              onClick={() => handlePage(filters.page + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
