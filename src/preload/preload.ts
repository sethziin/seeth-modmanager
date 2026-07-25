import { contextBridge, ipcRenderer } from 'electron';
import type {
  DetectedGame,
  GameDetails,
  InstalledMod,
  ModUpdate,
  DownloadItem,
  DownloadMetadata,
  DownloadProgress,
  DownloadResult,
  AppConfig,
  LogEntry,
  LogFilter,
} from '../shared/types';

function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

function send(channel: string, ...args: unknown[]): void {
  ipcRenderer.send(channel, ...args);
}

function on<T>(channel: string, callback: (data: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, data: T): void => callback(data);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const electronAPI = {
  catalog: {
    search: (query: string, filters?: Record<string, unknown>): Promise<readonly unknown[]> =>
      invoke<readonly unknown[]>('catalog:search', query, filters),
    getEntry: (id: string): Promise<unknown> =>
      invoke<unknown>('catalog:get-entry', id),
    getGames: (): Promise<readonly string[]> =>
      invoke<readonly string[]>('catalog:get-games'),
  },
  game: {
    detectAll: (): Promise<readonly DetectedGame[]> =>
      invoke<readonly DetectedGame[]>('game:detect-all'),
    getDetails: (gameId: string): Promise<GameDetails> =>
      invoke<GameDetails>('game:get-details', gameId),
    setDirectory: (gameId: string, path: string): Promise<void> =>
      invoke<void>('game:set-directory', gameId, path),
  },
  mod: {
    install: (gameId: string, filePath: string): Promise<InstalledMod> =>
      invoke<InstalledMod>('mod:install', gameId, filePath),
    uninstall: (gameId: string, modId: string): Promise<void> =>
      invoke<void>('mod:uninstall', gameId, modId),
    enable: (gameId: string, modId: string): Promise<void> =>
      invoke<void>('mod:enable', gameId, modId),
    disable: (gameId: string, modId: string): Promise<void> =>
      invoke<void>('mod:disable', gameId, modId),
    getInstalled: (gameId: string): Promise<readonly InstalledMod[]> =>
      invoke<readonly InstalledMod[]>('mod:get-installed', gameId),
    checkUpdates: (gameId: string): Promise<readonly ModUpdate[]> =>
      invoke<readonly ModUpdate[]>('mod:check-updates', gameId),
    onInstallProgress: (callback: (progress: { stage: string; message: string }) => void): (() => void) =>
      on<{ stage: string; message: string }>('mod:install-progress', callback),
  },
  download: {
    start: (url: string, metadata: DownloadMetadata): Promise<string> =>
      invoke<string>('download:start', url, metadata),
    cancel: (downloadId: string): Promise<void> =>
      invoke<void>('download:cancel', downloadId),
    getQueue: (): Promise<readonly DownloadItem[]> =>
      invoke<readonly DownloadItem[]>('download:get-queue'),
    onProgress: (callback: (progress: DownloadProgress) => void): (() => void) =>
      on<DownloadProgress>('download:progress', callback),
    onComplete: (callback: (result: DownloadResult) => void): (() => void) =>
      on<DownloadResult>('download:complete', callback),
    onError: (callback: (error: { downloadId: string; error: string }) => void): (() => void) =>
      on<{ downloadId: string; error: string }>('download:error', callback),
  },
  config: {
    get: (): Promise<AppConfig> =>
      invoke<AppConfig>('config:get'),
    set: (updates: Partial<Omit<AppConfig, 'version'>>): Promise<AppConfig> =>
      invoke<AppConfig>('config:set', updates),
    reset: (): Promise<AppConfig> =>
      invoke<AppConfig>('config:reset'),
  },
  fs: {
    selectDirectory: (title?: string): Promise<string | null> =>
      invoke<string | null>('fs:select-directory', title),
    getDiskUsage: (path: string): Promise<{ totalSizeMB: number; fileCount: number }> =>
      invoke<{ totalSizeMB: number; fileCount: number }>('fs:get-disk-usage', path),
  },
  window: {
    minimize: (): void => send('window:minimize'),
    maximize: (): void => send('window:maximize'),
    close: (): void => send('window:close'),
  },
  app: {
    getVersion: (): Promise<string> =>
      invoke<string>('app:get-version'),
  },
  log: {
    getEntries: (filter?: LogFilter): Promise<readonly LogEntry[]> =>
      invoke<readonly LogEntry[]>('log:get-entries', filter),
    clear: (): Promise<void> =>
      invoke<void>('log:clear'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
