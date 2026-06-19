/**
 * Settings + theme store. Hydrates from the main process on startup and
 * persists every change back through the IPC bridge.
 */
import { create } from 'zustand';
import type { AppSettings, ThemeMode, DependencyStatus } from '@shared/types';

interface SettingsState {
  settings: AppSettings | null;
  deps: DependencyStatus | null;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  refreshDeps: () => Promise<void>;
  applyTheme: (theme: ThemeMode) => void;
}

function resolveTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return theme;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  deps: null,
  loaded: false,

  load: async () => {
    const settings = await window.mediavault.getSettings();
    set({ settings, loaded: true });
    get().applyTheme(settings.theme);
    get().refreshDeps();
  },

  update: async (patch) => {
    const settings = await window.mediavault.setSettings(patch);
    set({ settings });
    if (patch.theme) get().applyTheme(settings.theme);
  },

  refreshDeps: async () => {
    try {
      const deps = await window.mediavault.checkDependencies();
      set({ deps });
    } catch {
      /* ignore — Settings page shows "unknown" */
    }
  },

  applyTheme: (theme) => {
    const resolved = resolveTheme(theme);
    const root = document.documentElement;
    root.classList.toggle('light', resolved === 'light');
    root.classList.toggle('dark', resolved === 'dark');
  },
}));
