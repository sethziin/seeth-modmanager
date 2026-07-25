import { create } from 'zustand';
import type { DownloadItem, DownloadProgress, DownloadResult, DownloadMetadata } from '../../../shared/types';
import { getIpcAdapter } from '../lib/ipc-adapter';

interface DownloadState {
  readonly activeDownloads: readonly DownloadItem[];
  readonly completedDownloads: readonly DownloadItem[];
  readonly loading: boolean;
  readonly error: string | null;

  readonly loadQueue: () => Promise<void>;
  readonly startDownload: (url: string, metadata: DownloadMetadata) => Promise<string>;
  readonly cancelDownload: (downloadId: string) => Promise<void>;
  readonly onProgress: (callback: (progress: DownloadProgress) => void) => () => void;
  readonly onComplete: (callback: (result: DownloadResult) => void) => () => void;
  readonly onError: (callback: (error: { downloadId: string; error: string }) => void) => () => void;
  readonly clearError: () => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  activeDownloads: [],
  completedDownloads: [],
  loading: false,
  error: null,

  loadQueue: async () => {
    set({ loading: true, error: null });
    try {
      const adapter = getIpcAdapter();
      const queue = await adapter.download.getQueue();
      const active = queue.filter((d) => d.status === 'downloading' || d.status === 'pending' || d.status === 'paused');
      const completed = queue.filter((d) => d.status === 'completed' || d.status === 'failed' || d.status === 'cancelled');
      set({ activeDownloads: active, completedDownloads: completed, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  startDownload: async (url, metadata) => {
    set({ loading: true, error: null });
    try {
      const adapter = getIpcAdapter();
      const downloadId = await adapter.download.start(url, metadata);
      set({ loading: false });
      return downloadId;
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  cancelDownload: async (downloadId) => {
    try {
      const adapter = getIpcAdapter();
      await adapter.download.cancel(downloadId);
      set((state) => ({
        activeDownloads: state.activeDownloads.filter((d) => d.id !== downloadId),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  onProgress: (callback) => {
    const adapter = getIpcAdapter();
    return adapter.download.onProgress(callback);
  },

  onComplete: (callback) => {
    const adapter = getIpcAdapter();
    return adapter.download.onComplete(callback);
  },

  onError: (callback) => {
    const adapter = getIpcAdapter();
    return adapter.download.onError(callback);
  },

  clearError: () => set({ error: null }),
}));
