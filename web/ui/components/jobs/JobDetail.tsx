"use client";

import { useState } from "react";
import { useJobStore } from "@/stores/jobs";
import { formatDate, formatDateTime, formatDuration, statusBadge } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";
import { X, ExternalLink, MapPin, Building2, DollarSign, FileText, CheckCircle2, XCircle, Trash2, Edit3, FileCode } from "lucide-react";
import { toast } from "sonner";

export default function JobDetail() {
  const job = useJobStore((s) => s.selectedJob);
  const selectedResume = useJobStore((s) => s.selectedResume);
  const selectedCoverLetter = useJobStore((s) => s.selectedCoverLetter);
  const clearSelection = useJobStore((s) => s.clearSelection);
  const markJob = useJobStore((s) => s.markJob);
  const updateScore = useJobStore((s) => s.updateScore);
  const deleteJob = useJobStore((s) => s.deleteJob);

  const [activeTab, setActiveTab] = useState<"overview" | "description" | "resume" | "cover">("overview");
  const [editingScore, setEditingScore] = useState(false);
  const [newScore, setNewScore] = useState(7);
  const [newReasoning, setNewReasoning] = useState("");

  if (!job) return null;

  const handleSaveScore = async () => {
    try {
      await updateScore(job.url, newScore, newReasoning || "Manually adjusted score");
      toast.success("Score updated successfully");
      setEditingScore(false);
    } catch {
      toast.error("Failed to update score");
    }
  };

  const handleMark = async (status: string) => {
    try {
      await markJob(job.url, status);
      toast.success(`Job marked as ${status}`);
    } catch {
      toast.error("Failed to mark job");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(job.url);
      toast.info("Job removed from pipeline");
    } catch {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] lg:w-[560px] bg-[#12161f] border-l border-[#2a3447] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="sticky top-0 bg-[#0d1017] border-b border-[#2a3447] p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <ScoreBadge score={job.fit_score} />
          <h2 className="text-sm font-semibold text-slate-200 truncate max-w-[340px]">
            {job.title || "Job Details"}
          </h2>
        </div>
        <button onClick={clearSelection} className="btn btn-ghost btn-sm p-1.5 hover:bg-[#222938]">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a3447] bg-[#12161f] px-4 pt-2 gap-2 text-xs font-medium">
        {[
          { id: "overview", label: "Overview" },
          { id: "description", label: "Full Description" },
          { id: "resume", label: "Tailored Resume" },
          { id: "cover", label: "Cover Letter" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-100 leading-snug">{job.title || "Untitled Role"}</h3>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                {job.site && (
                  <span className="flex items-center gap-1 bg-[#181d28] px-2.5 py-1 rounded-md border border-[#2a3447]">
                    <Building2 size={13} className="text-blue-400" />
                    {job.site}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1 bg-[#181d28] px-2.5 py-1 rounded-md border border-[#2a3447]">
                    <MapPin size={13} className="text-emerald-400" />
                    {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="flex items-center gap-1 bg-[#181d28] px-2.5 py-1 rounded-md border border-[#2a3447]">
                    <DollarSign size={13} className="text-amber-400" />
                    {job.salary}
                  </span>
                )}
              </div>
            </div>

            {/* Score Reasoning Card */}
            <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  AI Fit Reasoning
                </span>
                <button
                  onClick={() => {
                    setEditingScore(!editingScore);
                    setNewScore(job.fit_score ?? 7);
                  }}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Edit3 size={12} /> Override Score
                </button>
              </div>

              {editingScore ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-300">New Score (1-10):</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newScore}
                      onChange={(e) => setNewScore(Number(e.target.value))}
                      className="input w-20 py-1 text-center"
                    />
                  </div>
                  <textarea
                    placeholder="Reasoning for manual score override..."
                    value={newReasoning}
                    onChange={(e) => setNewReasoning(e.target.value)}
                    className="input w-full h-16 text-xs"
                  />
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={handleSaveScore}>
                      Save Override
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingScore(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {job.score_reasoning || "No detailed fit reasoning recorded for this job."}
                </p>
              )}
            </div>

            {/* Pipeline Stage Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Apply Status</span>
                <div className="mt-1">
                  <span className={`badge ${statusBadge(job.apply_status)}`}>
                    {job.apply_status || "Discovered"}
                  </span>
                </div>
              </div>
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Discovered Date</span>
                <div className="text-xs text-slate-200 mt-1 font-mono">{formatDate(job.discovered_at)}</div>
              </div>
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Scored</span>
                <div className="text-xs text-slate-200 mt-1 font-mono">{formatDate(job.scored_at)}</div>
              </div>
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Resume Tailored</span>
                <div className="text-xs text-slate-200 mt-1 font-mono">{formatDate(job.tailored_at)}</div>
              </div>
            </div>

            {/* Application Attempts */}
            {job.apply_attempts != null && job.apply_attempts > 0 && (
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Auto-Apply Session Log
                </span>
                <div className="text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Attempts</span>
                    <span>{job.apply_attempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Attempt</span>
                    <span>{formatDateTime(job.last_attempted_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span>{formatDuration(job.apply_duration_ms)}</span>
                  </div>
                  {job.apply_error && (
                    <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                      {job.apply_error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "description" && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Job Description
            </h4>
            <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans max-h-[500px] overflow-y-auto">
              {job.full_description || job.description || "No full description available for this job."}
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tailored Resume
            </h4>
            {selectedResume?.tailored ? (
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                {selectedResume.tailored}
              </div>
            ) : (
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-8 text-center text-xs text-slate-400">
                <FileCode size={24} className="mx-auto mb-2 text-slate-500" />
                Resume has not been tailored for this job yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "cover" && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Generated Cover Letter
            </h4>
            {selectedCoverLetter?.text ? (
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-serif max-h-[500px] overflow-y-auto">
                {selectedCoverLetter.text}
              </div>
            ) : (
              <div className="bg-[#181d28] border border-[#2a3447] rounded-xl p-8 text-center text-xs text-slate-400">
                <FileText size={24} className="mx-auto mb-2 text-slate-500" />
                Cover letter has not been generated for this job yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Action Footer */}
      <div className="p-4 border-t border-[#2a3447] bg-[#0d1017] flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => handleMark("applied")}>
            <CheckCircle2 size={14} className="text-emerald-400" /> Applied
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleMark("failed")}>
            <XCircle size={14} className="text-amber-400" /> Failed
          </button>
          <button className="btn btn-ghost btn-sm text-rose-400" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>

        {job.application_url && (
          <a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <ExternalLink size={13} /> Open Application Page
          </a>
        )}
      </div>
    </div>
  );
}
