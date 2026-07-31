"use client";

import { useState } from "react";
import { useJobStore } from "@/stores/jobs";
import { Filter, X, ArrowUpDown, Search as SearchIcon, RotateCcw } from "lucide-react";

const STAGES = [
  { value: "", label: "All Stages" },
  { value: "discovered", label: "Discovered" },
  { value: "pending_enrichment", label: "Pending Enrichment" },
  { value: "enriched", label: "Enriched" },
  { value: "pending_score", label: "Pending Score" },
  { value: "scored", label: "Scored (7+)" },
  { value: "tailored", label: "Tailored" },
  { value: "ready_to_apply", label: "Ready to Apply" },
  { value: "applied", label: "Applied" },
  { value: "failed", label: "Failed" },
];

const SORT_OPTIONS = [
  { value: "fit_score", label: "Fit Score" },
  { value: "title", label: "Role Title" },
  { value: "site", label: "Source Site" },
  { value: "discovered_at", label: "Discovery Date" },
];

export default function JobFilters() {
  const filters = useJobStore((s) => s.filters);
  const setFilters = useJobStore((s) => s.setFilters);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    fetchJobs();
    setOpen(false);
  };

  const handleReset = () => {
    setFilters({
      stage: "",
      minScore: null,
      maxScore: null,
      site: "",
      search: "",
      sortBy: "fit_score",
      sortDir: "desc",
      page: 1,
    });
    fetchJobs();
  };

  const toggleSortDir = () => {
    setFilters({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" });
    fetchJobs();
  };

  return (
    <>
      <button
        className="btn btn-ghost btn-sm lg:hidden mb-3"
        onClick={() => setOpen(!open)}
      >
        <Filter size={14} />
        Filter Jobs
      </button>

      <aside
        className={`${
          open ? "fixed inset-0 z-40 bg-[#0d1017] p-5 overflow-y-auto" : "hidden"
        } lg:block lg:relative lg:w-64 lg:min-w-64 lg:border-r lg:border-[#2a3447] lg:bg-[#12161f] lg:p-4 lg:overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filters</h3>
          <button onClick={() => setOpen(false)} className="text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Pipeline Stage
            </label>
            <select
              className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200"
              value={filters.stage}
              onChange={(e) => setFilters({ stage: e.target.value })}
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Score Filter (1 - 10)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200 text-center"
                placeholder="Min Score"
                min={1}
                max={10}
                value={filters.minScore ?? ""}
                onChange={(e) => setFilters({ minScore: e.target.value ? Number(e.target.value) : null })}
              />
              <input
                type="number"
                className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200 text-center"
                placeholder="Max Score"
                min={1}
                max={10}
                value={filters.maxScore ?? ""}
                onChange={(e) => setFilters({ maxScore: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Career Site / ATS
            </label>
            <input
              type="text"
              className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200"
              placeholder="e.g. greenhouse, workday"
              value={filters.site}
              onChange={(e) => setFilters({ site: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Keywords Search
            </label>
            <div className="relative">
              <input
                type="text"
                className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200 pl-8"
                placeholder="Title, location, tech..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
              />
              <SearchIcon size={14} className="absolute left-2.5 top-3 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Sorting Order
            </label>
            <div className="flex gap-2">
              <select
                className="input flex-1 bg-[#181d28] border-[#2a3447] text-slate-200"
                value={filters.sortBy}
                onChange={(e) => setFilters({ sortBy: e.target.value })}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                className="btn btn-ghost btn-sm border-[#2a3447]"
                onClick={toggleSortDir}
                title={filters.sortDir === "asc" ? "Ascending" : "Descending"}
              >
                <ArrowUpDown size={14} className={filters.sortDir === "asc" ? "rotate-180" : ""} />
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button className="btn btn-primary w-full justify-center" onClick={handleApply}>
              Apply Filters
            </button>
            <button className="btn btn-ghost w-full justify-center text-slate-400 hover:text-slate-200" onClick={handleReset}>
              <RotateCcw size={12} /> Reset Defaults
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
