import { create } from "zustand";
import { api } from "@/lib/api";
import type { MatchJob } from "@/lib/types";

interface MatchStore {
  isRunning: boolean;
  taskId: string | null;
  statusMsg: string;
  todayJobs: MatchJob[];
  jobsDate: string | null;
  jobsLoading: boolean;
  runMatch: (role: string, location: string, username: string) => Promise<void>;
  pollResult: () => Promise<boolean | null>;
  loadTodayJobs: (username?: string) => Promise<void>;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  isRunning: false,
  taskId: null,
  statusMsg: "",
  todayJobs: [],
  jobsDate: null,
  jobsLoading: false,

  runMatch: async (role, location, username) => {
    set({ isRunning: true, statusMsg: "Parsing your role and scraping job platforms…" });
    const res = await api.runMatch(role, location, username);
    set({ taskId: res.task_id });
  },

  pollResult: async () => {
    const { taskId, isRunning } = get();
    if (!taskId || !isRunning) return null;
    try {
      const res = await api.getMatchResult(taskId);
      if (res.count !== undefined && res.path !== undefined) {
        set({ isRunning: false, statusMsg: `Done — ${res.count} matched jobs saved.`, taskId: null });
        return res.count >= 0;
      }
    } catch {
      // task still running or not yet found — keep polling
    }
    return null;
  },

  loadTodayJobs: async (username) => {
    set({ jobsLoading: true });
    try {
      const res = await api.getTodayJobs(username);
      set({ todayJobs: res.jobs, jobsDate: res.date, jobsLoading: false });
    } catch {
      set({ todayJobs: [], jobsLoading: false });
    }
  },
}));