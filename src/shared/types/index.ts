export type { Result } from './result';
export { ok, err } from './result';
export type { AppError, ErrorCode } from './error';
export { createError } from './error';
export type {
  Platform,
  DetectedGame,
  GameInstallation,
  GameDetails,
  ValidationResult,
  GameDependency,
  ModCategory,
} from './game';
export type {
  InstalledMod,
  ModFile,
  ModArchive,
  ModArchiveFile,
  ModValidation,
  ModUpdate,
  ModInstallResult,
  ModConflict,
} from './mod';
export type {
  DownloadStatus,
  DownloadItem,
  DownloadMetadata,
  DownloadProgress,
  DownloadResult,
} from './download';
export type {
  AppConfig,
  GeneralConfig,
  DownloadConfig,
  ModManagementConfig,
  CacheConfig,
  LoggingConfig,
  WindowConfig,
  GameRegistry,
  GameRegistryEntry,
  ModRegistry,
  ModRegistryEntry,
  ModRegistryFile,
} from './config';
export type { LogLevel, LogEntry, LogFilter } from './log';
export type { GameProvider } from './provider';
