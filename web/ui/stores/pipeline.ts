import { create } from "zustand";
import { api } from "@/lib/api";
import type { PipelineConfig, PipelineStatus, PipelineEvent } from "@/lib/types";

interface PipelineStore {
  isRunning: boolean;
  taskId: string | null;
  elapsed: number;
  events: PipelineEvent[];
  startPipeline: (config: PipelineConfig) => Promise<void>;
  cancelPipeline: () => Promise<void>;
  handleWSEvent: (event: PipelineEvent) => void;
  pollStatus: () => Promise<void>;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  isRunning: false,
  taskId: null,
  elapsed: 0,
  events: [],

  startPipeline: async (config) => {
    const { task_id } = await api.runPipeline(config as unknown as Record<string, unknown>);
    set({ isRunning: true, taskId: task_id, events: [] });
  },

  cancelPipeline: async () => {
    await api.cancelPipeline();
    set({ isRunning: false, taskId: null });
  },

  handleWSEvent: (event) => {
    set((s) => ({
      events: [...s.events.slice(-99), event],
      isRunning: event.type !== "pipeline_complete" && event.type !== "pipeline_error",
    }));
    if (event.type === "pipeline_complete" || event.type === "pipeline_error") {
      set({ isRunning: false, taskId: null });
    }
  },

  pollStatus: async () => {
    try {
      const status = await api.getPipelineStatus();
      set({ isRunning: status.running, taskId: status.task_id, elapsed: status.elapsed });
    } catch { /* ignore */ }
  },
}));
