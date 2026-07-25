import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { InstalledMod, ModFile, ModConflict } from '../../shared/types/mod';
import type { LogService } from './log-service';
import type { ConfigService } from './config-service';
import type { FileSystemService } from './filesystem-service';
import type { BackupService } from './backup-service';
import type { GameService } from './game-service';
import type { ModInstaller } from './mod-installer';
import type { PathResolver } from './path-resolver';

export class ModService {
  private readonly log: LogService;
  private readonly config: ConfigService;
  private readonly fileSystem: FileSystemService;
  private readonly backup: BackupService;
  private readonly gameService: GameService;
  private readonly installer: ModInstaller;
  private readonly paths: PathResolver;

  constructor(
    gameService: GameService,
    fileSystem: FileSystemService,
    config: ConfigService,
    backup: BackupService,
    log: LogService,
    installer: ModInstaller,
    paths: PathResolver,
  ) {
    this.gameService = gameService;
    this.fileSystem = fileSystem;
    this.config = config;
    this.backup = backup;
    this.log = log;
    this.installer = installer;
    this.paths = paths;
  }

  async getInstalledMods(gameId: string): Promise<Result<readonly InstalledMod[]>> {
    const registryResult = this.config.getModRegistry(gameId);
    if (!registryResult.success) {
      return err(registryResult.error);
    }

    const mods: InstalledMod[] = registryResult.data.mods.map((entry) => ({
      id: entry.id,
      gameId,
      name: entry.name,
      version: entry.version,
      author: entry.author,
      category: { id: entry.category, name: entry.category, icon: 'extension' },
      enabled: entry.enabled,
      installedAt: entry.installedAt,
      updatedAt: entry.updatedAt,
      files: entry.files.map((f) => ({
        relativePath: f.relativePath,
        originalHash: f.originalHash,
        modHash: f.modHash,
        action: f.action,
      })),
      sourcePath: entry.sourcePath,
      sourceUrl: entry.sourceUrl,
      dependencies: [...entry.dependencies],
      tags: [...entry.tags],
      verified: entry.verified,
      verifiedVersion: entry.verifiedVersion,
      isCoreDependency: entry.isCoreDependency,
      thumbnailPath: entry.thumbnailPath,
    }));

    return ok(mods);
  }

  async getModDetails(gameId: string, modId: string): Promise<Result<InstalledMod>> {
    const modsResult = await this.getInstalledMods(gameId);
    if (!modsResult.success) {
      return err(modsResult.error);
    }

    const mod = modsResult.data.find((m) => m.id === modId);
    if (!mod) {
      return err(
        createError('MOD_NOT_FOUND', `Mod not found: ${modId}`, {
          recoverable: false,
        }),
      );
    }

    return ok(mod);
  }

  async installMod(
    gameId: string,
    modPath: string,
  ): Promise<Result<InstalledMod>> {
    const provider = this.gameService.getProvider(gameId);
    if (!provider) {
      return err(
        createError('MOD_INSTALL_FAILED', 'Game provider not found', {
          recoverable: false,
        }),
      );
    }

    return this.installer.install(gameId, modPath);
  }

  async detectConflicts(gameId: string, archivePath: string): Promise<Result<readonly ModConflict[]>> {
    return this.installer.detectConflicts(gameId, archivePath);
  }

  async uninstallMod(gameId: string, modId: string): Promise<Result<void>> {
    const gameRegistryResult = this.config.getGameRegistry();
    if (!gameRegistryResult.success) return err(gameRegistryResult.error);

    const gameEntry = gameRegistryResult.data.games[gameId];
    if (!gameEntry) {
      return err(
        createError('GAME_NOT_FOUND', 'Game not registered', { recoverable: true }),
      );
    }

    const registryResult = this.config.getModRegistry(gameId);
    if (!registryResult.success) return err(registryResult.error);

    const modIndex = registryResult.data.mods.findIndex((m) => m.id === modId);
    if (modIndex === -1) {
      return err(createError('MOD_NOT_FOUND', `Mod not found: ${modId}`, { recoverable: false }));
    }

    const mod = registryResult.data.mods[modIndex]!;
    if (mod.isCoreDependency) {
      return err(
        createError('MOD_UNINSTALL_FAILED', 'Cannot remove core dependency', { recoverable: false }),
      );
    }

    const installPath = gameEntry.installPath;

    for (const f of mod.files) {
      const filePath = path.join(installPath, f.relativePath);

      if (!fs.existsSync(filePath)) continue;

      if (f.modHash) {
        const currentHash = this.fileSystem.calculateFileHash(filePath);
        if (currentHash.success && currentHash.data !== f.modHash) {
          continue;
        }
      }

      try {
        if (f.action === 'replace' && f.originalHash) {
          const backupResult = this.findBackupForFile(gameId, f.relativePath);
          if (backupResult) {
            const backupFilePath = path.join(backupResult, f.relativePath);
            if (fs.existsSync(backupFilePath)) {
              fs.copyFileSync(backupFilePath, filePath);
              continue;
            }
          }
        }
        fs.rmSync(filePath, { force: true });
        this.removeEmptyParentDirs(path.dirname(filePath), installPath);
      } catch (error) {
        this.log.warn('ModService', `Failed to remove file during uninstall: ${f.relativePath}`, {
          gameId, modId, error,
        });
      }
    }

    this.cleanDisabledDir(gameId, modId);

    const registry = {
      ...registryResult.data,
      mods: registryResult.data.mods.filter((m) => m.id !== modId),
    };

    const writeResult = this.config.writeModRegistry(gameId, registry);
    if (!writeResult.success) return err(writeResult.error);

    this.log.info('ModService', `Mod uninstalled: ${mod.name}`, { gameId, modId });
    return ok(undefined);
  }

  async enableMod(gameId: string, modId: string): Promise<Result<void>> {
    const gameRegistryResult = this.config.getGameRegistry();
    if (!gameRegistryResult.success) return err(gameRegistryResult.error);

    const gameEntry = gameRegistryResult.data.games[gameId];
    if (!gameEntry) {
      return err(createError('GAME_NOT_FOUND', 'Game not registered', { recoverable: true }));
    }

    const registryResult = this.config.getModRegistry(gameId);
    if (!registryResult.success) return err(registryResult.error);

    const mod = registryResult.data.mods.find((m) => m.id === modId);
    if (!mod) {
      return err(createError('MOD_NOT_FOUND', `Mod not found: ${modId}`, { recoverable: false }));
    }

    if (mod.enabled) return ok(undefined);

    const installPath = gameEntry.installPath;
    const disabledDir = this.paths.disabledDir(gameId, modId);
    const disabledManifestPath = this.paths.disabledManifestFile(gameId, modId);

    if (!fs.existsSync(disabledDir)) {
      return err(
        createError('MOD_UNINSTALL_FAILED', 'No disabled files found for this mod', {
          details: { modId },
          recoverable: true,
          suggestion: 'Reinstall the mod instead',
        }),
      );
    }

    let disabledManifest: DisabledManifest = { files: [] };
    try {
      if (fs.existsSync(disabledManifestPath)) {
        disabledManifest = JSON.parse(fs.readFileSync(disabledManifestPath, 'utf-8')) as DisabledManifest;
      }
    } catch {
      // Proceed without manifest
    }

    for (const f of mod.files) {
      const disabledFilePath = path.join(disabledDir, f.relativePath);
      const targetPath = path.join(installPath, f.relativePath);
      const targetDir = path.dirname(targetPath);

      if (fs.existsSync(disabledFilePath)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.renameSync(disabledFilePath, targetPath);
      }
    }

    this.cleanDisabledDir(gameId, modId);

    const updatedMods = registryResult.data.mods.map((m) =>
      m.id === modId ? { ...m, enabled: true, updatedAt: new Date().toISOString() } : m,
    );

    const writeResult = this.config.writeModRegistry(gameId, { ...registryResult.data, mods: updatedMods });
    if (!writeResult.success) return err(writeResult.error);

    this.log.info('ModService', `Mod enabled: ${mod.name}`, { gameId, modId });
    return ok(undefined);
  }

  async disableMod(gameId: string, modId: string): Promise<Result<void>> {
    const gameRegistryResult = this.config.getGameRegistry();
    if (!gameRegistryResult.success) return err(gameRegistryResult.error);

    const gameEntry = gameRegistryResult.data.games[gameId];
    if (!gameEntry) {
      return err(createError('GAME_NOT_FOUND', 'Game not registered', { recoverable: true }));
    }

    const registryResult = this.config.getModRegistry(gameId);
    if (!registryResult.success) return err(registryResult.error);

    const mod = registryResult.data.mods.find((m) => m.id === modId);
    if (!mod) {
      return err(createError('MOD_NOT_FOUND', `Mod not found: ${modId}`, { recoverable: false }));
    }

    if (!mod.enabled) return ok(undefined);

    const installPath = gameEntry.installPath;
    const disabledDir = this.paths.disabledDir(gameId, modId);

    if (!fs.existsSync(disabledDir)) {
      fs.mkdirSync(disabledDir, { recursive: true });
    }

    const disabledManifest: DisabledManifest = { files: [] };

    for (const f of mod.files) {
      const sourcePath = path.join(installPath, f.relativePath);
      const disabledFilePath = path.join(disabledDir, f.relativePath);
      const disabledFileDir = path.dirname(disabledFilePath);

      if (!fs.existsSync(sourcePath)) continue;

      if (f.action === 'replace' && f.originalHash) {
        const currentHash = this.fileSystem.calculateFileHash(sourcePath);
        if (currentHash.success && currentHash.data !== f.modHash) {
          this.log.warn('ModService', `File modified by user, skipping disable move: ${f.relativePath}`, {
            gameId, modId,
          });
          continue;
        }

        const backupResult = this.findBackupForFile(gameId, f.relativePath);
        if (backupResult) {
          const backupFilePath = path.join(backupResult, f.relativePath);
          if (fs.existsSync(backupFilePath)) {
            if (!fs.existsSync(path.dirname(backupFilePath))) {
              fs.mkdirSync(path.dirname(backupFilePath), { recursive: true });
            }
            fs.renameSync(sourcePath, disabledFilePath);
            fs.copyFileSync(backupFilePath, sourcePath);
            disabledManifest.files.push({
              relativePath: f.relativePath,
              originalHash: f.originalHash,
            });
            continue;
          }
        }
      }

      if (!fs.existsSync(disabledFileDir)) {
        fs.mkdirSync(disabledFileDir, { recursive: true });
      }
      fs.renameSync(sourcePath, disabledFilePath);
      disabledManifest.files.push({
        relativePath: f.relativePath,
        originalHash: '',
      });
    }

    try {
      fs.writeFileSync(this.paths.disabledManifestFile(gameId, modId), JSON.stringify(disabledManifest, null, 2));
    } catch {
      // Best-effort manifest write
    }

    const updatedMods = registryResult.data.mods.map((m) =>
      m.id === modId ? { ...m, enabled: false, updatedAt: new Date().toISOString() } : m,
    );

    const writeResult = this.config.writeModRegistry(gameId, { ...registryResult.data, mods: updatedMods });
    if (!writeResult.success) return err(writeResult.error);

    this.log.info('ModService', `Mod disabled: ${mod.name}`, { gameId, modId });
    return ok(undefined);
  }

  async checkForUpdates(gameId: string): Promise<Result<readonly { modId: string; currentVersion: string; latestVersion: string; downloadUrl: string }[]>> {
    const modsResult = await this.getInstalledMods(gameId);
    if (!modsResult.success) {
      return err(modsResult.error);
    }
    return ok([]);
  }

  private findBackupForFile(gameId: string, relativePath: string): string | null {
    const backupsDir = this.paths.gameBackupsDir(gameId);
    if (!fs.existsSync(backupsDir)) return null;

    try {
      const timestamps = fs.readdirSync(backupsDir)
        .filter((name) => {
          const dir = path.join(backupsDir, name);
          return fs.statSync(dir).isDirectory();
        })
        .sort()
        .reverse();

      for (const ts of timestamps) {
        const backupFilePath = path.join(backupsDir, ts, relativePath);
        if (fs.existsSync(backupFilePath)) {
          return path.join(backupsDir, ts);
        }
      }
    } catch {
      // Best-effort
    }

    return null;
  }

  private cleanDisabledDir(gameId: string, modId: string): void {
    const dir = this.paths.disabledDir(gameId, modId);
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // Best-effort
      }
    }
  }

  private removeEmptyParentDirs(dir: string, stopAt: string): void {
    try {
      if (dir === stopAt || dir.length <= stopAt.length) return;
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        this.removeEmptyParentDirs(path.dirname(dir), stopAt);
      }
    } catch {
      // Best-effort on cleanup
    }
  }
}

interface DisabledManifest {
  files: DisabledManifestFile[];
}

interface DisabledManifestFile {
  readonly relativePath: string;
  readonly originalHash: string;
}
