import { z } from 'zod';

export const generalConfigSchema = z.object({
  language: z.string().default('en'),
  autoCheckUpdates: z.boolean().default(true),
  updateCheckInterval: z.number().default(86400000),
  startMinimized: z.boolean().default(false),
  minimizeToTray: z.boolean().default(true),
  theme: z.enum(['dark', 'light']).default('dark'),
});

export const downloadConfigSchema = z.object({
  maxConcurrent: z.number().min(1).max(10).default(3),
  downloadPath: z.string().default(''),
  autoInstallAfterDownload: z.boolean().default(false),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(0).default(5000),
});

export const modManagementConfigSchema = z.object({
  createBackupBeforeInstall: z.boolean().default(true),
  maxBackupsPerGame: z.number().min(1).max(50).default(5),
  showConflictWarnings: z.boolean().default(true),
  autoEnableAfterInstall: z.boolean().default(true),
});

export const cacheConfigSchema = z.object({
  maxSizeMB: z.number().min(100).max(50000).default(5000),
  autoCleanupDays: z.number().min(1).max(365).default(30),
});

export const loggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  maxFileSizeMB: z.number().min(1).max(100).default(10),
  maxFiles: z.number().min(1).max(20).default(3),
});

export const windowConfigSchema = z.object({
  width: z.number().min(800).default(1280),
  height: z.number().min(600).default(800),
  x: z.number().nullable().default(null),
  y: z.number().nullable().default(null),
  maximized: z.boolean().default(false),
});

export const appConfigSchema = z.object({
  version: z.literal(1).default(1),
  general: generalConfigSchema.default({}),
  downloads: downloadConfigSchema.default({}),
  modManagement: modManagementConfigSchema.default({}),
  cache: cacheConfigSchema.default({}),
  logging: loggingConfigSchema.default({}),
  window: windowConfigSchema.default({}),
});

export const gameRegistryEntrySchema = z.object({
  name: z.string(),
  installPath: z.string(),
  platform: z.string(),
  detectedAt: z.string(),
  lastPlayed: z.string().optional(),
  gameVersion: z.string().default('unknown'),
  configured: z.boolean().default(false),
});

export const gameRegistrySchema = z.object({
  version: z.literal(1).default(1),
  games: z.record(z.string(), gameRegistryEntrySchema).default({}),
});

export const modRegistryFileSchema = z.object({
  relativePath: z.string(),
  originalHash: z.string().default(''),
  modHash: z.string().default(''),
  action: z.enum(['add', 'replace']).default('add'),
});

export const modRegistryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().default('0.0.0'),
  author: z.string().default('Unknown'),
  category: z.string().default('scripts'),
  enabled: z.boolean().default(true),
  installedAt: z.string(),
  updatedAt: z.string(),
  files: z.array(modRegistryFileSchema).default([]),
  sourcePath: z.string().optional(),
  sourceUrl: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  verifiedVersion: z.string().optional(),
  isCoreDependency: z.boolean().default(false),
  thumbnailPath: z.string().optional(),
});

export const modRegistrySchema = z.object({
  version: z.literal(1).default(1),
  gameId: z.string(),
  mods: z.array(modRegistryEntrySchema).default([]),
});

export type AppConfigInput = z.infer<typeof appConfigSchema>;
export type GameRegistryInput = z.infer<typeof gameRegistrySchema>;
export type ModRegistryInput = z.infer<typeof modRegistrySchema>;
