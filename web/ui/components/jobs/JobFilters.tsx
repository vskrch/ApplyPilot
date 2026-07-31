"use client";

import { useState } from "react";
import { useJobStore } from "@/stores/jobs";
import { Filter, X, ArrowUpDown } from "lucide-react";

const STAGES = [
  { value: "", label: "All" },
  { value: "discovered", label: "Discovered" },
  { value: "pending_enrichment", label: "Pending Enrichment" },
  { value: "enriched", label: "Enriched" },
  { value: "pending_score", label: "Pending Score" },
  { value: "scored", label: "Scored" },
  { value: "tailored", label: "Tailored" },
  { value: "ready_to_apply", label: "Ready to Apply" },
  { value: "applied", label: "Applied" },
  { value: "failed", label: "Failed" },
];

const SORT_OPTIONS = [
  { value: "fit_score", label: "Score" },
  { value: "title", label: "Title" },
  { value: "site", label: "Site" },
  { value: "discovered_at", label: "Date" },
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

  const toggleSortDir = () => {
    setFilters({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" });
  };

  return (
    <>
      <button
        className="btn btn-ghost btn-sm lg:hidden"
        onClick={() => setOpen(!open)}
      >
        <Filter size={14} />
        Filters
      </button>

      <aside
        className={`${
          open ? "fixed inset-0 z-40 bg-[var(--bg-primary)] p-4 overflow-y-auto" : "hidden"
        } lg:block lg:relative lg:w-64 lg:min-w-64 lg:border-r lg:border-[var(--border)] lg:p-4 lg:overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Filters</h3>
          <button onClick={() => setOpen(false)} className="text-[var(--text-muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Stage</label>
            <select
              className="input w-full"
              value={filters.stage}
              onChange={(e) => setFilters({ stage: e.target.value })}
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Score Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="input w-20"
                placeholder="Min"
                min={1}
                max={10}
                value={filters.minScore ?? ""}
                onChange={(e) => setFilters({ minScore: e.target.value ? Number(e.target.value) : null })}
              />
              <input
                type="number"
                className="input w-20"
                placeholder="Max"
                min={1}
                max={10}
                value={filters.maxScore ?? ""}
                onChange={(e) => setFilters({ maxScore: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Site</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g. greenhouse"
              value={filters.site}
              onChange={(e) => setFilters({ site: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Search</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Title, location, description..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Sort</label>
            <div className="flex gap-2">
              <select
                className="input flex-1"
                value={filters.sortBy}
                onChange={(e) => setFilters({ sortBy: e.target.value })}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                className="btn btn-ghost btn-sm"
                onClick={toggleSortDir}
                title={filters.sortDir === "asc" ? "Ascending" : "Descending"}
              >
                <ArrowUpDown size={14} className={filters.sortDir === "asc" ? "rotate-180" : ""} />
              </button>
            </div>
          </div>

          <button className="btn btn-primary w-full justify-center" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}
