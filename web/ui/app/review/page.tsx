"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/stores/match";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { truncate } from "@/lib/utils";

export default function ReviewPage() {
  const router = useRouter();
  const { todayJobs, jobsDate, jobsLoading, loadTodayJobs } = useMatchStore();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ap_username") || "";
    setUsername(saved);
    loadTodayJobs(saved || undefined);
  }, [loadTodayJobs]);

  return (
    <div className="matcha-root">
      <div className="matcha-container">
        <button className="matcha-btn matcha-btn-ghost mb-8" onClick={() => router.push("/")}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="matcha-eyebrow">{jobsDate ? `Matched ${jobsDate}` : "Today&apos;s matches"}</div>
        <h1 className="matcha-hero" style={{ fontSize: "clamp(28px, 4vw, 38px)" }}>
          {todayJobs.length > 0 ? `${todayJobs.length} roles matched` : "No matches yet"}
        </h1>
        <p className="matcha-sub">
          {todayJobs.length > 0
            ? "Review the roles we surfaced. Hit Apply to open the original posting."
            : "Run a search from the home page to surface your matched roles."}
        </p>

        <div className="flex items-center gap-3 mb-8">
          <button className="matcha-btn matcha-btn-ghost" onClick={() => loadTodayJobs(username || undefined)} disabled={jobsLoading}>
            {jobsLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>
          <span className="matcha-note" style={{ marginTop: 0 }}>
            {username ? `Filtered for ${username}` : "All users"}
          </span>
        </div>

        {jobsLoading ? (
          <div className="matcha-empty">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--matcha-accent)" }} />
            <p className="matcha-note" style={{ marginTop: 12 }}>Loading today&apos;s jobs…</p>
          </div>
        ) : todayJobs.length === 0 ? (
          <div className="matcha-empty">
            <p className="matcha-empty-title">No jobs saved today</p>
            <p className="matcha-note">Describe your ideal role on the home page to start matching.</p>
          </div>
        ) : (
          <div className="matcha-jobs">
            {todayJobs.map((job, i) => (
              <div key={`${job.url}-${i}`} className="matcha-job">
                <h2 className="matcha-job-title">{job.title || "Untitled role"}</h2>
                <p className="matcha-job-meta">
                  {job.company && <span>{job.company}</span>}
                  {job.company && job.location && <span> · </span>}
                  {job.location && <span>{truncate(job.location, 60)}</span>}
                  {job.posting_date && <span> · posted {job.posting_date}</span>}
                  {job.username && <span className="matcha-pill" style={{ marginLeft: 8 }}>{job.username}</span>}
                </p>
                {job.description && (
                  <p className="matcha-job-desc">{truncate(job.description, 240)}</p>
                )}
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="matcha-apply"
                >
                  Apply <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}