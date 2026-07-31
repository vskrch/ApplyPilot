import { create } from "zustand";
import { api } from "@/lib/api";
import type { ApplyConfig, WorkerInfo, ApplyEvent } from "@/lib/types";

interface ApplyStore {
  isRunning: boolean;
  workers: WorkerInfo[];
  totals: { applied: number; failed: number; cost: number };
  events: ApplyEvent[];
  startApply: (config: ApplyConfig) => Promise<void>;
  stopApply: () => Promise<void>;
  handleWSEvent: (event: ApplyEvent) => void;
  pollStatus: () => Promise<void>;
}

export const useApplyStore = create<ApplyStore>((set) => ({
  isRunning: false,
  workers: [],
  totals: { applied: 0, failed: 0, cost: 0 },
  events: [],

  startApply: async (config) => {
    await api.startApply(config as unknown as Record<string, unknown>);
    set({ isRunning: true, events: [] });
  },

  stopApply: async () => {
    await api.stopApply();
    set({ isRunning: false });
  },

  handleWSEvent: (event) => {
    if (event.type === "workers_update") {
      set({
        workers: (event.workers as WorkerInfo[]) || [],
        totals: (event.totals as { applied: number; failed: number; cost: number }) || { applied: 0, failed: 0, cost: 0 },
      });
    } else if (event.type === "apply_complete") {
      set({ isRunning: false });
    }
    set((s) => ({ events: [...s.events.slice(-99), event] }));
  },

  pollStatus: async () => {
    try {
      const status = await api.getApplyStatus();
      set({
        isRunning: status.running,
        workers: status.workers,
        totals: status.totals,
      });
    } catch { /* ignore */ }
  },
}));
