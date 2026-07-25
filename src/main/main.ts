import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { LogService } from './services/log-service';
import { ConfigService } from './services/config-service';
import { FileSystemService } from './services/filesystem-service';
import { CacheService } from './services/cache-service';
import { BackupService } from './services/backup-service';
import { GameService } from './services/game-service';
import { ModService } from './services/mod-service';
import { DownloadService } from './services/download-service';
import { PathResolver } from './services/path-resolver';
import { ArchiveService } from './services/archive-service';
import { ModValidator } from './services/mod-validator';
import { ModInstaller } from './services/mod-installer';
import { CatalogService, LocalCatalogProvider } from './services/catalog-service';
import { DependencyService } from './services/dependency-service';
import { GTAVProvider } from './providers/gtav.provider';
import { registerWindowIpcHandlers } from './ipc/window.ipc';
import { registerAppIpcHandlers } from './ipc/app.ipc';
import { registerConfigIpcHandlers } from './ipc/config.ipc';
import { registerLogIpcHandlers } from './ipc/log.ipc';
import { registerFsIpcHandlers } from './ipc/fs.ipc';
import { registerGameIpcHandlers } from './ipc/game.ipc';
import { registerModIpcHandlers } from './ipc/mod.ipc';
import { registerDownloadIpcHandlers } from './ipc/download.ipc';
import { registerCatalogIpcHandlers } from './ipc/catalog.ipc';

const paths = new PathResolver();
const DATA_DIR = paths.getDataDir();

let mainWindow: BrowserWindow | null = null;
let logService: LogService | null = null;

function initializeServices(): {
  log: LogService;
  config: ConfigService;
  fileSystem: FileSystemService;
  cache: CacheService;
  backup: BackupService;
  game: GameService;
  mod: ModService;
  download: DownloadService;
  installer: ModInstaller;
  catalog: CatalogService;
  dependency: DependencyService;
} {
  const log = new LogService(paths.logsDir(), { level: 'debug' });
  logService = log;

  const config = new ConfigService(DATA_DIR, log);
  const fileSystem = new FileSystemService(log, [DATA_DIR]);
  const archive = new ArchiveService();
  const cache = new CacheService(paths.cacheDir(), log, fileSystem, config);
  const backup = new BackupService(paths.backupsDir(), log, fileSystem, config);
  const game = new GameService(log, config, fileSystem);

  const gtavProvider = new GTAVProvider(log);
  const validator = new ModValidator(archive, gtavProvider.getModCategories());
  gtavProvider.setValidator(validator);
  const installer = new ModInstaller(validator, archive, fileSystem, backup, config, game, log, paths);
  const mod = new ModService(game, fileSystem, config, backup, log, installer, paths);
  const download = new DownloadService(log, fileSystem, cache, config);
  const catalog = new CatalogService();
  const localCatalog = new LocalCatalogProvider(log, paths.catalogsDir());
  catalog.registerProvider(localCatalog);
  const dependency = new DependencyService(log, fileSystem, config, DATA_DIR);

  game.registerProvider(gtavProvider);
  dependency.registerGameDependencies('gtav', gtavProvider.getRequiredDependencies().map((d) => ({
    id: d.id,
    name: d.name,
    type: 'tool' as const,
    required: d.required,
    description: d.description,
    downloadUrl: d.downloadUrl,
  })));
  void catalog.refreshAll();

  log.info('Main', 'Services initialized');

  return { log, config, fileSystem, cache, backup, game, mod, download, installer, catalog, dependency };
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    backgroundColor: '#131315',
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function registerIpcHandlers(services: ReturnType<typeof initializeServices>): void {
  if (!mainWindow) return;

  registerWindowIpcHandlers(mainWindow);
  registerAppIpcHandlers();
  registerConfigIpcHandlers(services.config);
  registerLogIpcHandlers(services.log);
  registerFsIpcHandlers(services.cache, mainWindow);
  registerGameIpcHandlers(services.game);
  registerModIpcHandlers(services.mod);
  registerDownloadIpcHandlers(services.download);
  registerCatalogIpcHandlers(services.catalog);

  services.installer.onProgress((stage, message) => {
    mainWindow?.webContents.send('mod:install-progress', { stage, message });
  });

  services.download.setCallbacks(
    (progress) => {
      mainWindow?.webContents.send('download:progress', progress);
    },
    (result) => {
      mainWindow?.webContents.send('download:complete', result);
    },
    (downloadId, error) => {
      mainWindow?.webContents.send('download:error', { downloadId, error });
    },
  );
}

app.whenReady().then(() => {
  const services = initializeServices();
  createWindow();
  registerIpcHandlers(services);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (logService) {
    logService.info('Main', 'Application closing');
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
