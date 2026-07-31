"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, formatDuration } from "@/lib/utils";
import ScoreBadge from "@/components/jobs/ScoreBadge";
import ResumeDiff from "@/components/jobs/ResumeDiff";
import { ArrowLeft, Building2, MapPin, DollarSign, ExternalLink, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import type { JobDetail as JobDetailType, JobResumeResponse } from "@/lib/types";

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Tab({ active, onClick, children }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[var(--accent)] text-[var(--accent)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ url: string }> }) {
  const { url } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<JobDetailType | null>(null);
  const [resume, setResume] = useState<JobResumeResponse | null>(null);
  const [coverLetter, setCoverLetter] = useState<{ text: string; pdf_url: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "resume" | "cover" | "history">("description");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [jobData, resumeData, coverData] = await Promise.all([
          api.getJob(url),
          api.getJobResume(url),
          api.getJobCoverLetter(url).catch(() => null),
        ]);
        setJob(jobData);
        setResume(resumeData);
        setCoverLetter(coverData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [url]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Job not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <button
            onClick={() => router.push("/jobs")}
            className="btn btn-ghost btn-sm mb-3"
          >
            <ArrowLeft size={14} />
            Back to Jobs
          </button>

          <div className="flex items-start gap-4">
            <ScoreBadge score={job.fit_score} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-snug">
                {job.title || "Untitled"}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                {job.site && (
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {job.site}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} />
                    {job.salary}
                  </span>
                )}
              </div>
            </div>
            {job.application_url && (
              <a
                href={job.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <ExternalLink size={14} />
                Apply
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-1 border-b border-[var(--border)] mb-4">
          <Tab active={activeTab === "description"} onClick={() => setActiveTab("description")}>
            Description
          </Tab>
          <Tab active={activeTab === "resume"} onClick={() => setActiveTab("resume")}>
            Tailored Resume
          </Tab>
          <Tab active={activeTab === "cover"} onClick={() => setActiveTab("cover")}>
            Cover Letter
          </Tab>
          <Tab active={activeTab === "history"} onClick={() => setActiveTab("history")}>
            Apply History
          </Tab>
        </div>

        {activeTab === "description" && (
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--text-secondary)] leading-relaxed">
              {job.full_description || job.description || "No description available."}
            </pre>
          </div>
        )}

        {activeTab === "resume" && (
          <ResumeDiff original={resume?.original || ""} tailored={resume?.tailored || null} />
        )}

        {activeTab === "cover" && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
            {coverLetter?.text ? (
              <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--text-secondary)] leading-relaxed">
                {coverLetter.text}
              </pre>
            ) : (
              <div className="text-[var(--text-muted)] text-sm">No cover letter available.</div>
            )}
            {coverLetter?.pdf_url && (
              <a
                href={coverLetter.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm mt-3"
              >
                <ExternalLink size={14} />
                View PDF
              </a>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Apply Attempts</div>
                <div className="text-sm text-[var(--text-primary)]">{job.apply_attempts || 0}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Last Attempt</div>
                <div className="text-sm text-[var(--text-primary)]">{formatDateTime(job.last_attempted_at)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Duration</div>
                <div className="text-sm text-[var(--text-primary)]">{formatDuration(job.apply_duration_ms)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Status</div>
                <div className="text-sm text-[var(--text-primary)]">{job.apply_status || "new"}</div>
              </div>
            </div>
            {job.apply_error && (
              <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded text-sm text-[var(--danger)]">
                {job.apply_error}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm">
            <RefreshCw size={14} />
            Re-score
          </button>
          <button className="btn btn-ghost btn-sm">
            <RefreshCw size={14} />
            Re-tailor
          </button>
          <button className="btn btn-ghost btn-sm">
            <CheckCircle size={14} />
            Mark Applied
          </button>
          <button className="btn btn-ghost btn-sm">
            <XCircle size={14} />
            Mark Failed
          </button>
          <button className="btn btn-danger btn-sm">
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </main>
    </div>
  );
}
