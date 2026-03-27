import { create } from "zustand";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";

interface SettingsStore {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  getCacheVersion: () => number;
}

const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await getSiteSettings();
      set({ settings, isLoading: false });
    } catch (err) {
      console.error("[SettingsStore] Failed to fetch site settings:", err);
      set({ error: "Failed to load settings", isLoading: false });
    }
  },

  getCacheVersion: () => {
    return get().settings?.template_cache_version || 0;
  },
}));

export default useSettingsStore;
