import path from 'node:path';
import { app } from 'electron';

export class PathResolver {
  private readonly dataDir: string;

  constructor(testDataDir?: string) {
    if (testDataDir) {
      this.dataDir = testDataDir;
    } else {
      const base = app.getPath('userData');
      this.dataDir = app.isPackaged ? base : `${base}-dev`;
    }
  }

  getDataDir(): string {
    return this.dataDir;
  }

  configFile(): string {
    return path.join(this.dataDir, 'config.json');
  }

  gameRegistryFile(): string {
    return path.join(this.dataDir, 'games.json');
  }

  modRegistryFile(gameId: string): string {
    return path.join(this.dataDir, 'games', gameId, 'mods.json');
  }

  modRegistryDir(gameId: string): string {
    return path.join(this.dataDir, 'games', gameId);
  }

  disabledDir(gameId: string, modId: string): string {
    return path.join(this.dataDir, 'games', gameId, 'disabled', modId);
  }

  disabledManifestFile(gameId: string, modId: string): string {
    return path.join(this.disabledDir(gameId, modId), 'manifest.json');
  }

  backupsDir(): string {
    return path.join(this.dataDir, 'backups');
  }

  gameBackupsDir(gameId: string): string {
    return path.join(this.dataDir, 'backups', gameId);
  }

  backupDir(gameId: string, timestamp: string): string {
    return path.join(this.gameBackupsDir(gameId), timestamp);
  }

  backupManifestFile(gameId: string, timestamp: string): string {
    return path.join(this.backupDir(gameId, timestamp), 'manifest.json');
  }

  cacheDir(): string {
    return path.join(this.dataDir, 'cache');
  }

  downloadsDir(): string {
    return path.join(this.dataDir, 'cache', 'downloads');
  }

  downloadDir(downloadId: string): string {
    return path.join(this.dataDir, 'cache', 'downloads', downloadId);
  }

  catalogsDir(): string {
    return path.join(this.dataDir, 'cache', 'catalogs');
  }

  localCatalogFile(): string {
    return path.join(this.dataDir, 'cache', 'catalogs', 'local', 'catalog.json');
  }

  tempDir(): string {
    return path.join(this.dataDir, 'temp');
  }

  stagingDir(modId: string): string {
    return path.join(this.dataDir, 'temp', 'staging', modId);
  }

  logsDir(): string {
    return path.join(this.dataDir, 'logs');
  }

  dependenciesFile(): string {
    return path.join(this.dataDir, 'dependencies.json');
  }

  getRequiredDirectories(): string[] {
    return [
      this.dataDir,
      path.join(this.dataDir, 'games'),
      this.cacheDir(),
      this.downloadsDir(),
      this.catalogsDir(),
      this.tempDir(),
      this.logsDir(),
    ];
  }
}
