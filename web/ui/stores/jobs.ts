import { create } from "zustand";
import { api } from "@/lib/api";
import type { JobSummary, JobDetail, JobResumeResponse, SortDir } from "@/lib/types";

interface JobFilters {
  stage: string;
  minScore: number | null;
  maxScore: number | null;
  site: string;
  search: string;
  sortBy: string;
  sortDir: SortDir;
  page: number;
  limit: number;
}

interface JobStore {
  jobs: JobSummary[];
  total: number;
  pages: number;
  filters: JobFilters;
  selectedJob: JobDetail | null;
  selectedResume: JobResumeResponse | null;
  selectedCoverLetter: { text: string; pdf_url: string | null } | null;
  loading: boolean;
  actionLoading: boolean;
  fetchJobs: () => Promise<void>;
  setFilters: (f: Partial<JobFilters>) => void;
  selectJob: (url: string) => Promise<void>;
  clearSelection: () => void;
  markJob: (url: string, status: string, reason?: string) => Promise<void>;
  updateScore: (url: string, score: number, reasoning: string) => Promise<void>;
  deleteJob: (url: string) => Promise<void>;
  fetchResume: (url: string) => Promise<void>;
  fetchCoverLetter: (url: string) => Promise<void>;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  total: 0,
  pages: 0,
  filters: {
    stage: "",
    minScore: null,
    maxScore: null,
    site: "",
    search: "",
    sortBy: "fit_score",
    sortDir: "desc",
    page: 1,
    limit: 50,
  },
  selectedJob: null,
  selectedResume: null,
  selectedCoverLetter: null,
  loading: false,
  actionLoading: false,

  fetchJobs: async () => {
    set({ loading: true });
    try {
      const f = get().filters;
      const data = await api.getJobs({
        stage: f.stage || undefined,
        min_score: f.minScore ?? undefined,
        max_score: f.maxScore ?? undefined,
        site: f.site || undefined,
        search: f.search || undefined,
        sort_by: f.sortBy,
        sort_dir: f.sortDir,
        page: f.page,
        limit: f.limit,
      });
      set({ jobs: data.jobs, total: data.total, pages: data.pages });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (f) => {
    set((s) => ({ filters: { ...s.filters, ...f, page: f.page ?? 1 } }));
  },

  selectJob: async (url) => {
    try {
      const job = await api.getJob(url);
      set({ selectedJob: job, selectedResume: null, selectedCoverLetter: null });
      get().fetchResume(url);
      get().fetchCoverLetter(url);
    } catch (err) {
      console.error("Failed to fetch job detail:", err);
    }
  },

  clearSelection: () => set({ selectedJob: null, selectedResume: null, selectedCoverLetter: null }),

  fetchResume: async (url) => {
    try {
      const resume = await api.getJobResume(url);
      set({ selectedResume: resume });
    } catch {
      set({ selectedResume: null });
    }
  },

  fetchCoverLetter: async (url) => {
    try {
      const cl = await api.getJobCoverLetter(url);
      set({ selectedCoverLetter: cl });
    } catch {
      set({ selectedCoverLetter: null });
    }
  },

  markJob: async (url, status, reason) => {
    set({ actionLoading: true });
    try {
      await api.markJob(url, status, reason);
      if (get().selectedJob?.url === url) {
        set((s) => s.selectedJob ? { selectedJob: { ...s.selectedJob, apply_status: status } } : s);
      }
      await get().fetchJobs();
    } finally {
      set({ actionLoading: false });
    }
  },

  updateScore: async (url, score, reasoning) => {
    set({ actionLoading: true });
    try {
      await api.updateJobScore(url, score, reasoning);
      if (get().selectedJob?.url === url) {
        set((s) => s.selectedJob ? { selectedJob: { ...s.selectedJob, fit_score: score, score_reasoning: reasoning } } : s);
      }
      await get().fetchJobs();
    } finally {
      set({ actionLoading: false });
    }
  },

  deleteJob: async (url) => {
    set({ actionLoading: true });
    try {
      await api.deleteJob(url);
      if (get().selectedJob?.url === url) {
        set({ selectedJob: null, selectedResume: null, selectedCoverLetter: null });
      }
      await get().fetchJobs();
    } finally {
      set({ actionLoading: false });
    }
  },
}));
