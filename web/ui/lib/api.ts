import type { JobListResponse, JobDetail, JobResumeResponse, DoctorResponse, EnvConfig, ApplyStatus, MatchJobsResponse, MatchResult, MatchRunResponse } from "./types";

const BASE = "";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Stats
  getStats: () => fetchJSON<Record<string, unknown>>("/api/stats"),
  getScoreDistribution: () => fetchJSON<{ score: number; count: number }[]>("/api/stats/score-distribution"),
  getStatsBySite: () => fetchJSON<{ site: string; total: number; high_fit: number; avg_score: number }[]>("/api/stats/by-site"),
  getTimeline: () => fetchJSON<{ date: string; discovered: number; scored: number; applied: number }[]>("/api/stats/timeline"),

  // Jobs
  getJobs: (params?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
    return fetchJSON<JobListResponse>(`/api/jobs?${qs.toString()}`);
  },
  getJob: (url: string) => fetchJSON<JobDetail>(`/api/jobs/${encodeURIComponent(url)}`),
  getJobResume: (url: string) => fetchJSON<JobResumeResponse>(`/api/jobs/${encodeURIComponent(url)}/resume`),
  getJobCoverLetter: (url: string) => fetchJSON<{ text: string; pdf_url: string | null }>(`/api/jobs/${encodeURIComponent(url)}/cover-letter`),
  updateJobScore: (url: string, score: number, reasoning: string) =>
    fetchJSON(`/api/jobs/${encodeURIComponent(url)}/score`, { method: "PUT", body: JSON.stringify({ score, reasoning }) }),
  deleteJob: (url: string) =>
    fetchJSON(`/api/jobs/${encodeURIComponent(url)}`, { method: "DELETE" }),

  // Pipeline
  runPipeline: (config: Record<string, unknown>) =>
    fetchJSON<{ task_id: string }>("/api/pipeline/run", { method: "POST", body: JSON.stringify(config) }),
  getPipelineStatus: () => fetchJSON<{ running: boolean; task_id: string | null; elapsed: number }>("/api/pipeline/status"),
  cancelPipeline: () => fetchJSON("/api/pipeline/cancel", { method: "POST" }),

  // Apply
  startApply: (config: Record<string, unknown>) =>
    fetchJSON<{ task_id: string }>("/api/apply/start", { method: "POST", body: JSON.stringify(config) }),
  stopApply: () => fetchJSON("/api/apply/stop", { method: "POST" }),
  getApplyStatus: () => fetchJSON<ApplyStatus>("/api/apply/status"),
  markJob: (url: string, status: string, reason?: string) =>
    fetchJSON("/api/apply/mark", { method: "POST", body: JSON.stringify({ url, status, reason }) }),
  resetFailed: () => fetchJSON<{ reset_count: number }>("/api/apply/reset-failed", { method: "POST" }),
  genPrompt: (url: string, model: string) =>
    fetchJSON<{ prompt: string; command: string }>(`/api/apply/gen-prompt?url=${encodeURIComponent(url)}&model=${model}`, { method: "POST" }),

  // Config
  getProfile: () => fetchJSON<Record<string, unknown>>("/api/config/profile"),
  saveProfile: (data: Record<string, unknown>) => fetchJSON("/api/config/profile", { method: "PUT", body: JSON.stringify(data) }),
  getSearches: () => fetchJSON<Record<string, unknown>>("/api/config/searches"),
  saveSearches: (data: Record<string, unknown>) => fetchJSON("/api/config/searches", { method: "PUT", body: JSON.stringify(data) }),
  getEnv: () => fetchJSON<EnvConfig>("/api/config/env"),
  saveEnv: (data: Record<string, unknown>) => fetchJSON<{ saved: boolean; tier: number }>("/api/config/env", { method: "PUT", body: JSON.stringify(data) }),
  getResume: () => fetchJSON<{ text: string; has_pdf: boolean }>("/api/config/resume"),
  getDoctor: () => fetchJSON<DoctorResponse>("/api/doctor"),
  getEmployers: () => fetchJSON<Record<string, unknown>>("/api/config/employers"),
  getSites: () => fetchJSON<Record<string, unknown>>("/api/config/sites"),

  // Match
  runMatch: (role: string, location: string, username: string) =>
    fetchJSON<MatchRunResponse>("/api/match/run", { method: "POST", body: JSON.stringify({ role, location, username }) }),
  getMatchResult: (taskId: string) => fetchJSON<MatchResult>(`/api/match/result/${encodeURIComponent(taskId)}`),
  getTodayJobs: (username?: string) =>
    fetchJSON<MatchJobsResponse>(`/api/match/jobs${username ? `?username=${encodeURIComponent(username)}` : ""}`),
};
