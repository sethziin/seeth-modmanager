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
} from '../../../shared/types';

export interface IpcAdapter {
  readonly catalog: {
    readonly search: (query: string, filters?: Record<string, unknown>) => Promise<readonly unknown[]>;
    readonly getEntry: (id: string) => Promise<unknown>;
    readonly getGames: () => Promise<readonly string[]>;
  };
  readonly game: {
    readonly detectAll: () => Promise<readonly DetectedGame[]>;
    readonly getDetails: (gameId: string) => Promise<GameDetails>;
    readonly setDirectory: (gameId: string, path: string) => Promise<void>;
  };
  readonly mod: {
    readonly install: (gameId: string, filePath: string) => Promise<InstalledMod>;
    readonly uninstall: (gameId: string, modId: string) => Promise<void>;
    readonly enable: (gameId: string, modId: string) => Promise<void>;
    readonly disable: (gameId: string, modId: string) => Promise<void>;
    readonly getInstalled: (gameId: string) => Promise<readonly InstalledMod[]>;
    readonly checkUpdates: (gameId: string) => Promise<readonly ModUpdate[]>;
    readonly onInstallProgress: (callback: (progress: { stage: string; message: string }) => void) => () => void;
  };
  readonly download: {
    readonly start: (url: string, metadata: DownloadMetadata) => Promise<string>;
    readonly cancel: (downloadId: string) => Promise<void>;
    readonly getQueue: () => Promise<readonly DownloadItem[]>;
    readonly onProgress: (callback: (progress: DownloadProgress) => void) => () => void;
    readonly onComplete: (callback: (result: DownloadResult) => void) => () => void;
    readonly onError: (callback: (error: { downloadId: string; error: string }) => void) => () => void;
  };
  readonly config: {
    readonly get: () => Promise<AppConfig>;
    readonly set: (updates: Partial<Omit<AppConfig, 'version'>>) => Promise<AppConfig>;
    readonly reset: () => Promise<AppConfig>;
  };
  readonly fs: {
    readonly selectDirectory: (title?: string) => Promise<string | null>;
    readonly getDiskUsage: (path: string) => Promise<{ totalSizeMB: number; fileCount: number }>;
  };
  readonly window: {
    readonly minimize: () => void;
    readonly maximize: () => void;
    readonly close: () => void;
  };
  readonly app: {
    readonly getVersion: () => Promise<string>;
  };
  readonly log: {
    readonly getEntries: (filter?: LogFilter) => Promise<readonly LogEntry[]>;
    readonly clear: () => Promise<void>;
  };
}

export function getIpcAdapter(): IpcAdapter {
  if (!window.electronAPI) {
    throw new Error('electronAPI not available - are you running outside Electron?');
  }
  return window.electronAPI as unknown as IpcAdapter;
}
