import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { InstalledMod, ModFile, ModValidation, ModConflict, ModInstallResult } from '../../shared/types/mod';
import type { ModValidator } from './mod-validator';
import type { ArchiveService } from './archive-service';
import type { FileSystemService } from './filesystem-service';
import type { BackupService } from './backup-service';
import type { ConfigService } from './config-service';
import type { GameService } from './game-service';
import type { LogService } from './log-service';
import type { PathResolver } from './path-resolver';

export type InstallStage = 'validating' | 'extracting' | 'backing-up' | 'copying' | 'registering' | 'done';

export type InstallProgressCallback = (stage: InstallStage, message: string) => void;

export class ModInstaller {
  private readonly validator: ModValidator;
  private readonly archive: ArchiveService;
  private readonly fileSystem: FileSystemService;
  private readonly backup: BackupService;
  private readonly config: ConfigService;
  private readonly gameService: GameService;
  private readonly log: LogService;
  private readonly paths: PathResolver;
  private progressCallback: InstallProgressCallback | null = null;

  constructor(
    validator: ModValidator,
    archive: ArchiveService,
    fileSystem: FileSystemService,
    backup: BackupService,
    config: ConfigService,
    gameService: GameService,
    log: LogService,
    paths: PathResolver,
  ) {
    this.validator = validator;
    this.archive = archive;
    this.fileSystem = fileSystem;
    this.backup = backup;
    this.config = config;
    this.gameService = gameService;
    this.log = log;
    this.paths = paths;
  }

  onProgress(callback: InstallProgressCallback): void {
    this.progressCallback = callback;
  }

  private emitProgress(stage: InstallStage, message: string): void {
    this.progressCallback?.(stage, message);
  }

  async install(gameId: string, archivePath: string): Promise<Result<InstalledMod>> {
    const provider = this.gameService.getProvider(gameId);
    if (!provider) {
      return err(
        createError('MOD_INSTALL_FAILED', 'Game provider not found', {
          recoverable: false,
        }),
      );
    }

    const gameRegistryResult = this.config.getGameRegistry();
    if (!gameRegistryResult.success) {
      return err(gameRegistryResult.error);
    }

    const gameEntry = gameRegistryResult.data.games[gameId];
    if (!gameEntry) {
      return err(
        createError('MOD_INSTALL_FAILED', 'Game not registered', {
          recoverable: true,
          suggestion: 'Configure the game installation first',
        }),
      );
    }

    const installPath = gameEntry.installPath;
    const modId = randomUUID();
    const stagingDir = this.paths.stagingDir(modId);

    try {
      this.emitProgress('validating', 'Validating mod archive...');
      const validation = await this.validator.validate(archivePath);
      if (!validation.success) {
        return err(validation.error);
      }

      const modData = validation.data;
      if (!modData.valid || !modData.mod) {
        return err(
          createError('MOD_INVALID_ARCHIVE', 'Mod archive failed validation', {
            details: modData.errors,
            recoverable: false,
          }),
        );
      }

      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }

      this.emitProgress('extracting', 'Extracting files...');
      const extractResult = this.archive.extractAll(archivePath, stagingDir);
      if (!extractResult.success) {
        this.cleanupStaging(stagingDir);
        return err(extractResult.error);
      }

      const modArchive = modData.mod;
      const backupFiles: string[] = [];
      for (const f of modArchive.files) {
        const sanitized = this.sanitizeDestPath(f.relativePath, installPath);
        if (!sanitized) {
          this.cleanupStaging(stagingDir);
          return err(
            createError('PATH_TRAVERSAL_DETECTED', `Invalid file path in mod: ${f.relativePath}`, {
              recoverable: false,
            }),
          );
        }

        if (f.action === 'replace') {
          const targetPath = path.join(installPath, sanitized);
          if (fs.existsSync(targetPath)) {
            backupFiles.push(sanitized);
          }
        }
      }

      const configResult = this.config.getConfig();
      const createBackup = configResult.success && configResult.data.modManagement.createBackupBeforeInstall;

      let backupManifest = null;
      if (createBackup && backupFiles.length > 0) {
        this.emitProgress('backing-up', 'Creating backup of existing files...');
        const backupResult = this.backup.createBackup(gameId, installPath, backupFiles);
        if (!backupResult.success) {
          this.cleanupStaging(stagingDir);
          return err(
            createError('BACKUP_FAILED', 'Failed to create backup before installation', {
              details: backupResult.error.message,
              recoverable: false,
            }),
          );
        }
        backupManifest = backupResult.data;
      }

      this.emitProgress('copying', 'Copying mod files...');
      const modFiles: ModFile[] = [];
      for (const f of modArchive.files) {
        const safeDest = this.sanitizeDestPath(f.relativePath, installPath);
        if (!safeDest) continue;

        const sourceInStaging = path.join(stagingDir, f.relativePath);
        const targetPath = path.join(installPath, safeDest);
        const targetDir = path.dirname(targetPath);

        if (!fs.existsSync(sourceInStaging)) {
          continue;
        }

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        try {
          fs.copyFileSync(sourceInStaging, targetPath);
        } catch (error) {
          if (backupManifest) {
            this.backup.restoreBackup(gameId, installPath, backupManifest);
          }
          this.cleanupStaging(stagingDir);
          return err(
            createError('MOD_INSTALL_FAILED', `Failed to copy file: ${f.relativePath}`, {
              details: error instanceof Error ? error.message : String(error),
              recoverable: false,
            }),
          );
        }

        let originalHash = '';
        if (backupManifest) {
          const backedUp = backupManifest.files.find((b) => b.relativePath === f.relativePath);
          if (backedUp) {
            originalHash = backedUp.originalHash;
          }
        }

        const hashResult = this.fileSystem.calculateFileHash(targetPath);
        modFiles.push({
          relativePath: safeDest,
          originalHash,
          modHash: hashResult.success ? hashResult.data : '',
          action: f.action,
        });
      }

      this.emitProgress('registering', 'Registering mod...');
      this.cleanupStaging(stagingDir);

      const now = new Date().toISOString();
      const installedMod: InstalledMod = {
        id: modId,
        gameId,
        name: modArchive.name,
        version: modArchive.version,
        author: modArchive.author,
        category: modArchive.category,
        enabled: true,
        installedAt: now,
        updatedAt: now,
        files: modFiles,
        sourcePath: archivePath,
        dependencies: [...modArchive.dependencies],
        tags: [...modArchive.tags],
        verified: false,
        isCoreDependency: false,
      };

      const registryResult = this.config.getModRegistry(gameId);
      if (!registryResult.success) {
        return err(registryResult.error);
      }

      const registry = { ...registryResult.data, mods: [...registryResult.data.mods] };
      registry.mods = [
        ...registry.mods,
        {
          id: modId,
          name: installedMod.name,
          version: installedMod.version,
          author: installedMod.author,
          category: installedMod.category.id,
          enabled: true,
          installedAt: now,
          updatedAt: now,
          files: modFiles.map((f) => ({
            relativePath: f.relativePath,
            originalHash: f.originalHash,
            modHash: f.modHash,
            action: f.action,
          })),
          sourcePath: archivePath,
          dependencies: [...installedMod.dependencies],
          tags: [...installedMod.tags],
          verified: false,
          isCoreDependency: false,
        },
      ];

      const writeResult = this.config.writeModRegistry(gameId, registry);
      if (!writeResult.success) {
        return err(writeResult.error);
      }

      this.emitProgress('done', `${installedMod.name} v${installedMod.version} installed`);
      this.log.info('ModInstaller', `Mod installed: ${installedMod.name} v${installedMod.version}`, {
        gameId,
        modId,
        fileCount: modFiles.length,
      });

      return ok(installedMod);
    } catch (error) {
      this.cleanupStaging(stagingDir);
      return err(
        createError('MOD_INSTALL_FAILED', 'Unexpected error during mod installation', {
          details: error instanceof Error ? error.message : String(error),
          recoverable: false,
        }),
      );
    }
  }

  async detectConflicts(gameId: string, archivePath: string): Promise<Result<readonly ModConflict[]>> {
    const validation = await this.validator.validate(archivePath);
    if (!validation.success || !validation.data.mod) {
      return ok([]);
    }

    const modArchive = validation.data.mod;
    const registryResult = this.config.getModRegistry(gameId);
    if (!registryResult.success) {
      return ok([]);
    }

    const conflicts: ModConflict[] = [];
    const incomingFiles = new Set(modArchive.files.map((f) => f.relativePath));

    for (const existingMod of registryResult.data.mods) {
      if (!existingMod.enabled) continue;

      for (const existingFile of existingMod.files) {
        if (incomingFiles.has(existingFile.relativePath)) {
          conflicts.push({
            filePath: existingFile.relativePath,
            existingModId: existingMod.id,
            existingModName: existingMod.name,
          });
        }
      }
    }

    return ok(conflicts);
  }

  private sanitizeDestPath(destPath: string, installPath: string): string | null {
    if (!destPath || destPath.length === 0) return null;
    if (destPath.includes('\0')) return null;

    const resolved = path.resolve(installPath, destPath);

    if (!resolved.startsWith(installPath)) {
      return null;
    }

    const normalized = path.normalize(destPath).replace(/\\/g, '/');
    if (normalized.startsWith('..') || normalized.includes('/../') || normalized.endsWith('/..')) {
      return null;
    }
    if (/^[A-Za-z]:[/\\]/.test(normalized)) {
      return null;
    }
    if (path.isAbsolute(normalized)) {
      return null;
    }

    return normalized;
  }

  private cleanupStaging(stagingDir: string): void {
    try {
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
    } catch {
      // Best-effort cleanup
    }
  }
}
