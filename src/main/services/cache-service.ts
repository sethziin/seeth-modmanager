import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { LogService } from './log-service';
import type { FileSystemService } from './filesystem-service';
import type { ConfigService } from './config-service';

export class CacheService {
  private readonly cacheDir: string;
  private readonly log: LogService;
  private readonly fileSystem: FileSystemService;
  private readonly config: ConfigService;

  constructor(
    cacheDir: string,
    log: LogService,
    fileSystem: FileSystemService,
    config: ConfigService,
  ) {
    this.cacheDir = cacheDir;
    this.log = log;
    this.fileSystem = fileSystem;
    this.config = config;
    this.ensureCacheDir();
  }

  getCacheDir(): string {
    return this.cacheDir;
  }

  getDownloadPath(): string {
    return path.join(this.cacheDir, 'downloads');
  }

  getDiskUsage(): Result<{ readonly totalSizeMB: number; readonly fileCount: number }> {
    const result = this.fileSystem.getDirectorySize(this.cacheDir);
    if (!result.success) {
      return err(result.error);
    }

    const fileCount = this.countFiles(this.cacheDir);
    const totalSizeMB = result.data / (1024 * 1024);

    return ok({ totalSizeMB: Math.round(totalSizeMB * 100) / 100, fileCount });
  }

  cleanup(): Result<number> {
    const configResult = this.config.getConfig();
    if (!configResult.success) {
      return err(configResult.error);
    }

    const { autoCleanupDays } = configResult.data.cache;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - autoCleanupDays);

    let removedCount = 0;

    try {
      const files = this.listFilesRecursive(this.cacheDir);
      for (const file of files) {
        const stat = fs.statSync(file);
        if (stat.mtime < cutoffDate) {
          const deleteResult = this.fileSystem.deleteFile(file);
          if (deleteResult.success) {
            removedCount++;
          }
        }
      }

      this.log.info('CacheService', `Cleaned up ${removedCount} cached files`);
      return ok(removedCount);
    } catch (error) {
      this.log.error('CacheService', 'Cache cleanup failed', error as Error);
      return err(
        createError('CACHE_CLEANUP_FAILED', 'Failed to clean up cache', {
          details: error,
          recoverable: true,
        }),
      );
    }
  }

  clearAll(): Result<void> {
    const result = this.fileSystem.deleteDirectory(this.cacheDir);
    if (!result.success) {
      return result;
    }
    this.ensureCacheDir();
    return ok(undefined);
  }

  private countFiles(dir: string): number {
    let count = 0;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += this.countFiles(fullPath);
        } else {
          count++;
        }
      }
    } catch {
      // Ignore errors counting files
    }
    return count;
  }

  private listFilesRecursive(dir: string): string[] {
    const files: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...this.listFilesRecursive(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore errors listing files
    }
    return files;
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    const downloadsDir = path.join(this.cacheDir, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
  }
}
