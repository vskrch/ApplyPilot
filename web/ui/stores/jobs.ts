import { create } from "zustand";
import { api } from "@/lib/api";
import type { JobSummary, JobDetail, JobListResponse, SortDir } from "@/lib/types";

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
  loading: boolean;
  fetchJobs: () => Promise<void>;
  setFilters: (f: Partial<JobFilters>) => void;
  selectJob: (url: string) => Promise<void>;
  clearSelection: () => void;
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
  loading: false,

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
      set({ selectedJob: job });
    } catch { /* ignore */ }
  },

  clearSelection: () => set({ selectedJob: null }),
}));
