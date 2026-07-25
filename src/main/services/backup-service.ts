import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { LogService } from './log-service';
import type { FileSystemService } from './filesystem-service';
import type { ConfigService } from './config-service';

export interface BackupManifest {
  readonly gameId: string;
  readonly timestamp: string;
  readonly files: readonly BackupFile[];
}

export interface BackupFile {
  readonly relativePath: string;
  readonly originalHash: string;
  readonly backupPath: string;
}

export class BackupService {
  private readonly backupsDir: string;
  private readonly log: LogService;
  private readonly fileSystem: FileSystemService;
  private readonly config: ConfigService;

  constructor(
    backupsDir: string,
    log: LogService,
    fileSystem: FileSystemService,
    config: ConfigService,
  ) {
    this.backupsDir = backupsDir;
    this.log = log;
    this.fileSystem = fileSystem;
    this.config = config;
    this.ensureBackupDir();
  }

  createBackup(
    gameId: string,
    gameDir: string,
    files: readonly string[],
  ): Result<BackupManifest> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.backupsDir, gameId, timestamp);

    const ensureResult = this.fileSystem.ensureDir(backupDir);
    if (!ensureResult.success) {
      return err(
        createError('BACKUP_FAILED', 'Failed to create backup directory', {
          recoverable: true,
        }),
      );
    }

    const backupFiles: BackupFile[] = [];

    for (const relativePath of files) {
      const sourcePath = path.join(gameDir, relativePath);
      if (!fs.existsSync(sourcePath)) {
        continue;
      }

      const hashResult = this.fileSystem.calculateFileHash(sourcePath);
      const originalHash = hashResult.success ? hashResult.data : '';

      const backupFilePath = path.join(backupDir, relativePath);
      const copyResult = this.fileSystem.copyFile(sourcePath, backupFilePath);
      if (!copyResult.success) {
        this.log.warn('BackupService', 'Failed to backup file', { relativePath });
        continue;
      }

      backupFiles.push({
        relativePath,
        originalHash,
        backupPath: backupFilePath,
      });
    }

    const manifest: BackupManifest = {
      gameId,
      timestamp: new Date().toISOString(),
      files: backupFiles,
    };

    const manifestPath = path.join(backupDir, 'manifest.json');
    const writeResult = this.fileSystem.writeJsonFile(manifestPath, manifest);
    if (!writeResult.success) {
      return err(
        createError('BACKUP_FAILED', 'Failed to write backup manifest', {
          recoverable: true,
        }),
      );
    }

    this.log.info('BackupService', 'Backup created', {
      gameId,
      fileCount: backupFiles.length,
    });

    return ok(manifest);
  }

  restoreBackup(
    gameId: string,
    gameDir: string,
    manifest: BackupManifest,
  ): Result<void> {
    for (const backupFile of manifest.files) {
      const targetPath = path.join(gameDir, backupFile.relativePath);
      const copyResult = this.fileSystem.copyFile(backupFile.backupPath, targetPath);
      if (!copyResult.success) {
        this.log.error('BackupService', 'Failed to restore file', undefined, {
          relativePath: backupFile.relativePath,
        });
        return err(
          createError('BACKUP_RESTORATION_FAILED', 'Failed to restore backup file', {
            details: { relativePath: backupFile.relativePath },
            recoverable: false,
          }),
        );
      }
    }

    this.log.info('BackupService', 'Backup restored', {
      gameId,
      fileCount: manifest.files.length,
    });

    return ok(undefined);
  }

  getBackups(gameId: string): Result<readonly BackupManifest[]> {
    const gameBackupsDir = path.join(this.backupsDir, gameId);
    if (!fs.existsSync(gameBackupsDir)) {
      return ok([]);
    }

    const entries = fs.readdirSync(gameBackupsDir);
    const manifests: BackupManifest[] = [];

    for (const entry of entries) {
      const manifestPath = path.join(gameBackupsDir, entry, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const readResult = this.fileSystem.readJsonFile<BackupManifest>(manifestPath);
        if (readResult.success) {
          manifests.push(readResult.data);
        }
      }
    }

    return ok(manifests.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  }

  cleanOldBackups(gameId: string): Result<number> {
    const configResult = this.config.getConfig();
    if (!configResult.success) {
      return err(configResult.error);
    }

    const maxBackups = configResult.data.modManagement.maxBackupsPerGame;
    const backupsResult = this.getBackups(gameId);
    if (!backupsResult.success) {
      return err(backupsResult.error);
    }

    const backups = backupsResult.data;
    if (backups.length <= maxBackups) {
      return ok(0);
    }

    const toRemove = backups.slice(maxBackups);
    let removedCount = 0;

    for (const backup of toRemove) {
      const timestamp = backup.timestamp.replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupsDir, gameId, timestamp);
      const deleteResult = this.fileSystem.deleteDirectory(backupDir);
      if (deleteResult.success) {
        removedCount++;
      }
    }

    this.log.info('BackupService', 'Cleaned old backups', {
      gameId,
      removed: removedCount,
    });

    return ok(removedCount);
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }
}
