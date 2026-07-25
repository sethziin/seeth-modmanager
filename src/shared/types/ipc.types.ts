import type { DetectedGame, GameDetails } from './game';
import type { InstalledMod, ModUpdate } from './mod';
import type { DownloadItem, DownloadMetadata, DownloadProgress, DownloadResult } from './download';
import type { AppConfig } from './config';
import type { LogEntry, LogFilter } from './log';

export interface IpcChannelMap {
  // Game
  'game:detect-all': { params: []; result: readonly DetectedGame[] };
  'game:get-details': { params: [gameId: string]; result: GameDetails };
  'game:set-directory': {
    params: [gameId: string, path: string];
    result: void;
  };

  // Mod
  'mod:install': {
    params: [gameId: string, filePath: string];
    result: InstalledMod;
  };
  'mod:uninstall': {
    params: [gameId: string, modId: string];
    result: void;
  };
  'mod:enable': {
    params: [gameId: string, modId: string];
    result: void;
  };
  'mod:disable': {
    params: [gameId: string, modId: string];
    result: void;
  };
  'mod:get-installed': {
    params: [gameId: string];
    result: readonly InstalledMod[];
  };
  'mod:check-updates': {
    params: [gameId: string];
    result: readonly ModUpdate[];
  };

  // Download
  'download:start': {
    params: [url: string, metadata: DownloadMetadata];
    result: string;
  };
  'download:cancel': { params: [downloadId: string]; result: void };
  'download:get-queue': { params: []; result: readonly DownloadItem[] };

  // Config
  'config:get': { params: []; result: AppConfig };
  'config:set': {
    params: [updates: Partial<Omit<AppConfig, 'version'>>];
    result: AppConfig;
  };
  'config:reset': { params: []; result: AppConfig };

  // File System
  'fs:select-directory': {
    params: [title?: string];
    result: string | null;
  };
  'fs:get-disk-usage': {
    params: [path: string];
    result: { totalSizeMB: number; fileCount: number };
  };

  // Window
  'window:minimize': { params: []; result: void };
  'window:maximize': { params: []; result: void };
  'window:close': { params: []; result: void };

  // App
  'app:get-version': { params: []; result: string };

  // Log
  'log:get-entries': {
    params: [filter?: LogFilter];
    result: readonly LogEntry[];
  };
  'log:clear': { params: []; result: void };
}

export type IpcChannel = keyof IpcChannelMap;

export type IpcParams<T extends IpcChannel> = IpcChannelMap[T]['params'];
export type IpcResult<T extends IpcChannel> = IpcChannelMap[T]['result'];

export type DownloadProgressChannel = 'download:progress';
export type DownloadCompleteChannel = 'download:complete';
export type DownloadErrorChannel = 'download:error';
export type ModInstallProgressChannel = 'mod:install-progress';
export type NotificationChannel = 'app:notification';

export interface IpcPushEvents {
  'download:progress': DownloadProgress;
  'download:complete': DownloadResult;
  'download:error': { downloadId: string; error: string };
  'mod:install-progress': { modId: string; progress: number };
  'app:notification': {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
  };
}

export type PushEventChannel = keyof IpcPushEvents;
export type PushEventData<T extends PushEventChannel> = IpcPushEvents[T];
