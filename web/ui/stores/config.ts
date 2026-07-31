import { create } from "zustand";
import { api } from "@/lib/api";
import type { DoctorCheck, EnvConfig, Profile } from "@/lib/types";

interface ConfigStore {
  profile: Profile | null;
  searches: Record<string, unknown> | null;
  env: EnvConfig | null;
  tier: number;
  tierLabel: string;
  doctorChecks: DoctorCheck[];
  resumeText: string;
  hasResumePdf: boolean;
  fetchProfile: () => Promise<void>;
  saveProfile: (p: Profile) => Promise<void>;
  fetchSearches: () => Promise<void>;
  saveSearches: (s: Record<string, unknown>) => Promise<void>;
  fetchEnv: () => Promise<void>;
  saveEnv: (e: Record<string, unknown>) => Promise<void>;
  fetchDoctor: () => Promise<void>;
  fetchResume: () => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  profile: null,
  searches: null,
  env: null,
  tier: 1,
  tierLabel: "Discovery",
  doctorChecks: [],
  resumeText: "",
  hasResumePdf: false,

  fetchProfile: async () => {
    try {
      const p = await api.getProfile();
      set({ profile: p });
    } catch { /* ignore */ }
  },

  saveProfile: async (p) => {
    await api.saveProfile(p);
    set({ profile: p });
  },

  fetchSearches: async () => {
    try {
      const s = await api.getSearches();
      set({ searches: s });
    } catch { /* ignore */ }
  },

  saveSearches: async (s) => {
    await api.saveSearches(s);
    set({ searches: s });
  },

  fetchEnv: async () => {
    try {
      const e = await api.getEnv();
      set({ env: e });
    } catch { /* ignore */ }
  },

  saveEnv: async (e) => {
    const result = await api.saveEnv(e);
    set({ tier: result.tier });
  },

  fetchDoctor: async () => {
    try {
      const d = await api.getDoctor();
      set({ tier: d.tier, tierLabel: d.tier_label, doctorChecks: d.checks });
    } catch { /* ignore */ }
  },

  fetchResume: async () => {
    try {
      const r = await api.getResume();
      set({ resumeText: r.text, hasResumePdf: r.has_pdf });
    } catch { /* ignore */ }
  },
}));
