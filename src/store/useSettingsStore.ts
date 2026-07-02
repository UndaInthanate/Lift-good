import { create } from 'zustand';
import { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants/defaults';
import * as settingsRepo from '@/db/settingsRepo';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,
  load: async () => {
    const settings = await settingsRepo.loadSettings();
    set({ settings, loaded: true });
  },
  update: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await settingsRepo.saveSettings(settings);
  },
}));
