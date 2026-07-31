"use client";

import { useEffect } from "react";
import { useJobStore } from "@/stores/jobs";
import JobFilters from "@/components/jobs/JobFilters";
import JobTable from "@/components/jobs/JobTable";
import JobDetail from "@/components/jobs/JobDetail";

export default function JobsPage() {
  const fetchJobs = useJobStore((s) => s.fetchJobs);

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <JobFilters />
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <header className="border-b border-[var(--border)] px-4 py-3">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Jobs</h1>
          </header>
          <JobTable />
        </div>
      </main>
      <JobDetail />
    </div>
  );
}
