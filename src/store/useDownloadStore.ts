/**
 * Download store. Holds the live list of DownloadItems and wires the
 * main-process progress stream into React. Components select narrow slices to
 * avoid unnecessary re-renders.
 */
import { create } from 'zustand';
import type { DownloadItem, DownloadRequest, AppStatistics } from '@shared/types';
import { useUiStore } from './useUiStore';

interface DownloadState {
  items: DownloadItem[];
  stats: AppStatistics | null;
  initialized: boolean;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshStats: () => Promise<void>;
  start: (req: DownloadRequest) => Promise<DownloadItem>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  /** internal: apply a single live progress update */
  _upsert: (item: DownloadItem) => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  items: [],
  stats: null,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    await get().refresh();
    await get().refreshStats();
    // Subscribe to live progress pushes from main.
    window.mediavault.onDownloadProgress((item) => get()._upsert(item));
    set({ initialized: true });
  },

  refresh: async () => {
    const items = await window.mediavault.listDownloads();
    set({ items });
  },

  refreshStats: async () => {
    const stats = await window.mediavault.getStatistics();
    set({ stats });
  },

  start: async (req) => {
    // Duplicate detection: if an identical (url + format) completed download
    // already exists, surface a non-blocking warning but still proceed so the
    // user keeps control. Bulk callers pass through unaffected.
    try {
      const dupe = await window.mediavault.checkDuplicate(req);
      if (dupe) {
        useUiStore.getState().toast(`Already downloaded: "${dupe.title}"`, 'info');
      }
    } catch {
      /* non-fatal — never block a download on the dupe check */
    }
    const item = await window.mediavault.startDownload(req);
    get()._upsert(item);
    return item;
  },

  pause: async (id) => window.mediavault.pauseDownload(id),
  resume: async (id) => window.mediavault.resumeDownload(id),
  cancel: async (id) => window.mediavault.cancelDownload(id),
  retry: async (id) => window.mediavault.retryDownload(id),

  remove: async (id) => {
    await window.mediavault.removeDownload(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  clearCompleted: async () => {
    await window.mediavault.clearCompleted();
    set((s) => ({
      items: s.items.filter(
        (i) => !['completed', 'failed', 'canceled'].includes(i.status),
      ),
    }));
  },

  _upsert: (item) => {
    set((s) => {
      const idx = s.items.findIndex((i) => i.id === item.id);
      if (idx === -1) return { items: [item, ...s.items] };
      const next = s.items.slice();
      next[idx] = item;
      // When a job finishes, refresh aggregate stats lazily.
      if (item.status === 'completed') {
        void get().refreshStats();
      }
      return { items: next };
    });
  },
}));
