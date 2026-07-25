export interface AppConfig {
  readonly version: number;
  readonly general: GeneralConfig;
  readonly downloads: DownloadConfig;
  readonly modManagement: ModManagementConfig;
  readonly cache: CacheConfig;
  readonly logging: LoggingConfig;
  readonly window: WindowConfig;
}

export interface GeneralConfig {
  readonly language: string;
  readonly autoCheckUpdates: boolean;
  readonly updateCheckInterval: number;
  readonly startMinimized: boolean;
  readonly minimizeToTray: boolean;
  readonly theme: 'dark' | 'light';
}

export interface DownloadConfig {
  readonly maxConcurrent: number;
  readonly downloadPath: string;
  readonly autoInstallAfterDownload: boolean;
  readonly maxRetries: number;
  readonly retryDelay: number;
}

export interface ModManagementConfig {
  readonly createBackupBeforeInstall: boolean;
  readonly maxBackupsPerGame: number;
  readonly showConflictWarnings: boolean;
  readonly autoEnableAfterInstall: boolean;
}

export interface CacheConfig {
  readonly maxSizeMB: number;
  readonly autoCleanupDays: number;
}

export interface LoggingConfig {
  readonly level: 'error' | 'warn' | 'info' | 'debug';
  readonly maxFileSizeMB: number;
  readonly maxFiles: number;
}

export interface WindowConfig {
  readonly width: number;
  readonly height: number;
  readonly x: number | null;
  readonly y: number | null;
  readonly maximized: boolean;
}

export interface GameRegistry {
  readonly version: number;
  readonly games: Record<string, GameRegistryEntry>;
}

export interface GameRegistryEntry {
  readonly name: string;
  readonly installPath: string;
  readonly platform: string;
  readonly detectedAt: string;
  readonly lastPlayed?: string;
  readonly gameVersion: string;
  readonly configured: boolean;
}

export interface ModRegistry {
  readonly version: number;
  readonly gameId: string;
  readonly mods: readonly ModRegistryEntry[];
}

export interface ModRegistryEntry {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly installedAt: string;
  readonly updatedAt: string;
  readonly files: readonly ModRegistryFile[];
  readonly sourcePath?: string;
  readonly sourceUrl?: string;
  readonly dependencies: readonly string[];
  readonly tags: readonly string[];
  readonly verified: boolean;
  readonly verifiedVersion?: string;
  readonly isCoreDependency: boolean;
  readonly thumbnailPath?: string;
}

export interface ModRegistryFile {
  readonly relativePath: string;
  readonly originalHash: string;
  readonly modHash: string;
  readonly action: 'add' | 'replace';
}
