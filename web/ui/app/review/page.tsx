"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useMatchStore } from "@/stores/match";
import { ExternalLink, Loader2, RefreshCw, Search, Sparkles, Filter, Briefcase, MapPin, Building, Calendar } from "lucide-react";
import { truncate } from "@/lib/utils";

export default function ReviewPage() {
  const { todayJobs, jobsDate, jobsLoading, loadTodayJobs } = useMatchStore();
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [selectedSiteFilter, setSelectedSiteFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("ap_username") || "";
    setUsername(saved);
    loadTodayJobs(undefined);
  }, [loadTodayJobs]);

  // Extract unique site/platform names
  const availableSites = useMemo(() => {
    const set = new Set<string>();
    todayJobs.forEach((j) => {
      if (j.platform) set.add(j.platform);
      if (j.site) set.add(j.site);
    });
    return Array.from(set);
  }, [todayJobs]);

  // Filter jobs based on search query, user filter, and site filter
  const filteredJobs = useMemo(() => {
    return todayJobs.filter((job) => {
      // Username filter
      if (selectedUserFilter === "mine" && username && job.username !== username) {
        return false;
      }
      if (selectedUserFilter !== "all" && selectedUserFilter !== "mine" && job.username !== selectedUserFilter) {
        return false;
      }

      // Site filter
      if (selectedSiteFilter !== "all") {
        const p = job.platform || job.site || "";
        if (p.toLowerCase() !== selectedSiteFilter.toLowerCase()) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (job.title || "").toLowerCase();
        const c = (job.company || "").toLowerCase();
        const l = (job.location || "").toLowerCase();
        const d = (job.description || "").toLowerCase();
        if (!t.includes(q) && !c.includes(q) && !l.includes(q) && !d.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [todayJobs, selectedUserFilter, selectedSiteFilter, searchQuery, username]);

  return (
    <div className="p-6 bg-[#0a0c10] min-h-screen space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#2a3447] gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Sparkles size={14} /> AI Role Matcher Review
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            Today&apos;s Surfaced Matches
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
              {jobsDate || "Today"} ({filteredJobs.length} / {todayJobs.length} roles)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Roles read and surfaced across 10k+ remote startup career portals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTodayJobs(undefined)}
            className="btn btn-ghost btn-sm border-[#2a3447] text-slate-300"
            disabled={jobsLoading}
          >
            <RefreshCw size={13} className={jobsLoading ? "animate-spin text-blue-400" : ""} />
            Refresh Matches
          </button>
          <Link href="/match" className="btn btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700 border-none">
            <Sparkles size={14} /> Run New Match
          </Link>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="card bg-[#12161f] border-[#2a3447] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search matched roles by title, company, or keywords..."
            className="input input-sm w-full pl-9 bg-[#181d28] border-[#2a3447] text-slate-200 text-xs focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* User Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter size={13} />
            <select
              className="select select-sm bg-[#181d28] border-[#2a3447] text-slate-200 text-xs"
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              {username && <option value="mine">My Matches ({username})</option>}
            </select>
          </div>

          {/* Site Filter */}
          {availableSites.length > 0 && (
            <select
              className="select select-sm bg-[#181d28] border-[#2a3447] text-slate-200 text-xs"
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
            >
              <option value="all">All Platforms</option>
              {availableSites.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Job Cards Grid */}
      {jobsLoading ? (
        <div className="card bg-[#12161f] border-[#2a3447] p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 size={32} className="animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-slate-300">Loading today&apos;s matched startup roles…</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card bg-[#12161f] border-[#2a3447] p-12 text-center flex flex-col items-center justify-center space-y-4">
          <Briefcase size={36} className="text-slate-500" />
          <div>
            <h3 className="text-base font-bold text-slate-200">No Matched Roles Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {todayJobs.length === 0
                ? "No roles have been surfaced today yet. Run a search query using the AI Role Matcher to discover remote startup jobs."
                : "No jobs match your current search filters. Try clearing your search query or platform filters."}
            </p>
          </div>
          <Link href="/match" className="btn btn-primary btn-sm bg-emerald-600 border-none">
            <Sparkles size={14} /> Start AI Matching
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job, idx) => (
            <div
              key={`${job.url}-${idx}`}
              className="card bg-[#12161f] border-[#2a3447] p-5 rounded-xl space-y-3 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug">
                    {job.title || "Untitled Role"}
                  </h3>
                  {job.username && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      @{job.username}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                  {job.company && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building size={13} className="text-blue-400" />
                      {job.company}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-amber-400" />
                      {truncate(job.location, 40)}
                    </span>
                  )}
                  {job.posting_date && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar size={13} />
                      {job.posting_date}
                    </span>
                  )}
                </div>

                {job.description && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 pt-1">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#2a3447]/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {job.platform || job.site || "Direct Career Site"}
                </span>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-1"
                >
                  Apply Direct <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}