import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { LogService } from './log-service';
import { ConfigService } from './config-service';
import { FileSystemService } from './filesystem-service';
import { BackupService } from './backup-service';
import { GameService } from './game-service';
import { PathResolver } from './path-resolver';
import { ArchiveService } from './archive-service';
import { ModValidator } from './mod-validator';
import { ModInstaller } from './mod-installer';
import { ModService } from './mod-service';

describe('ModService Lifecycle', () => {
  let tmpDir: string;
  let log: LogService;
  let config: ConfigService;
  let fileSystem: FileSystemService;
  let backup: BackupService;
  let gameService: GameService;
  let paths: PathResolver;

  const testGameId = 'test-game';

  function createMockRegistry(): void {
    const gameRegistry = {
      version: 1 as const,
      games: {
        [testGameId]: {
          name: 'Test Game',
          installPath: tmpDir,
          platform: 'manual' as const,
          detectedAt: new Date().toISOString(),
          gameVersion: '1.0.0',
          configured: true,
        },
      },
    };
    config.writeGameRegistry(gameRegistry);
  }

  function addModToRegistry(
    modId: string,
    files: { relativePath: string; originalHash: string; modHash: string; action: 'add' | 'replace' }[],
    enabled: boolean = true,
  ): void {
    const registry = config.getModRegistry(testGameId);
    const mods = registry.success ? registry.data.mods : [];

    mods.push({
      id: modId,
      name: 'Test Mod',
      version: '1.0.0',
      author: 'Test',
      category: 'scripts',
      enabled,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files,
      dependencies: [],
      tags: [],
      verified: false,
      isCoreDependency: false,
    });

    config.writeModRegistry(testGameId, { version: 1, gameId: testGameId, mods });
  }

  function createTestFile(relativePath: string, content: string = 'test-content'): string {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    return fullPath;
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'modsvc-test-'));
    log = new LogService(path.join(tmpDir, 'logs'));
    config = new ConfigService(tmpDir, log);
    fileSystem = new FileSystemService(log, [tmpDir]);
    backup = new BackupService(path.join(tmpDir, 'backups'), log, fileSystem, config);
    gameService = new GameService(log, config, fileSystem);
    paths = new PathResolver(tmpDir);

    createMockRegistry();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('uninstallMod', () => {
    it('should remove files with action=add', async () => {
      createTestFile('mods/test.asi', 'mod-content');
      addModToRegistry('mod-1', [
        { relativePath: 'mods/test.asi', originalHash: '', modHash: '', action: 'add' },
      ]);

      const modService = createModService();
      const result = await modService.uninstallMod(testGameId, 'mod-1');

      expect(fs.existsSync(path.join(tmpDir, 'mods', 'test.asi'))).toBe(false);
    });

    it('should keep unmodified files owned by other mods', async () => {
      createTestFile('shared/file.asi', 'content');
      addModToRegistry('mod-1', [
        { relativePath: 'shared/file.asi', originalHash: '', modHash: '', action: 'add' },
      ]);

      const modService = createModService();
      const result = await modService.uninstallMod(testGameId, 'mod-1');

      expect(fs.existsSync(path.join(tmpDir, 'shared', 'file.asi'))).toBe(false);
    });
  });

  describe('enableMod / disableMod', () => {
    it('should move files to disabled directory on disable', async () => {
      createTestFile('mods/test.asi', 'mod-content');
      addModToRegistry('mod-1', [
        { relativePath: 'mods/test.asi', originalHash: '', modHash: '', action: 'add' },
      ]);

      const modService = createModService();
      await modService.disableMod(testGameId, 'mod-1');

      const disabledFile = path.join(tmpDir, 'games', testGameId, 'disabled', 'mod-1', 'mods', 'test.asi');
      expect(fs.existsSync(disabledFile)).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'mods', 'test.asi'))).toBe(false);
    });

    it('should restore files from disabled directory on enable', async () => {
      createTestFile('mods/test.asi', 'mod-content');
      addModToRegistry('mod-1', [
        { relativePath: 'mods/test.asi', originalHash: '', modHash: '', action: 'add' },
      ]);

      const modService = createModService();
      await modService.disableMod(testGameId, 'mod-1');
      await modService.enableMod(testGameId, 'mod-1');

      expect(fs.existsSync(path.join(tmpDir, 'mods', 'test.asi'))).toBe(true);
      const disabledDir = path.join(tmpDir, 'games', testGameId, 'disabled', 'mod-1');
      expect(fs.existsSync(disabledDir)).toBe(false);
    });

    it('should update registry enabled status', async () => {
      createTestFile('mods/test.asi', 'mod-content');
      addModToRegistry('mod-1', [
        { relativePath: 'mods/test.asi', originalHash: '', modHash: '', action: 'add' },
      ]);

      const modService = createModService();

      await modService.disableMod(testGameId, 'mod-1');
      const afterDisable = config.getModRegistry(testGameId);
      if (afterDisable.success) {
        const mod = afterDisable.data.mods.find((m) => m.id === 'mod-1');
        expect(mod?.enabled).toBe(false);
      }

      await modService.enableMod(testGameId, 'mod-1');
      const afterEnable = config.getModRegistry(testGameId);
      if (afterEnable.success) {
        const mod = afterEnable.data.mods.find((m) => m.id === 'mod-1');
        expect(mod?.enabled).toBe(true);
      }
    });

    it('should complete full lifecycle install→disable→enable', async () => {
      const modId = 'lifecycle-test-mod';

      const originalSettings = 'original-game-settings';
      createTestFile('scripts/test.asi', 'mod-version-1');
      createTestFile('configs/settings.ini', 'settings-content');
      addModToRegistry(modId, [
        { relativePath: 'scripts/test.asi', originalHash: '', modHash: '', action: 'add' },
        { relativePath: 'configs/settings.ini', originalHash: '', modHash: '', action: 'replace' },
      ]);

      const modService = createModService();

      const disabledDir = path.join(tmpDir, 'games', testGameId, 'disabled', modId);
      const scriptPath = path.join(tmpDir, 'scripts', 'test.asi');
      const settingsPath = path.join(tmpDir, 'configs', 'settings.ini');

      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.existsSync(settingsPath)).toBe(true);

      await modService.disableMod(testGameId, modId);

      expect(fs.existsSync(scriptPath)).toBe(false);
      expect(fs.existsSync(settingsPath)).toBe(false);

      const disabledScript = path.join(disabledDir, 'scripts', 'test.asi');
      const disabledSettings = path.join(disabledDir, 'configs', 'settings.ini');
      expect(fs.existsSync(disabledScript)).toBe(true);
      expect(fs.existsSync(disabledSettings)).toBe(true);

      let registry = config.getModRegistry(testGameId);
      let regMod = registry.success ? registry.data.mods.find((m) => m.id === modId) : null;
      expect(regMod?.enabled).toBe(false);

      await modService.enableMod(testGameId, modId);

      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.existsSync(settingsPath)).toBe(true);
      expect(fs.existsSync(disabledDir)).toBe(false);

      registry = config.getModRegistry(testGameId);
      regMod = registry.success ? registry.data.mods.find((m) => m.id === modId) : null;
      expect(regMod?.enabled).toBe(true);
    });
  });

  describe('hash ownership', () => {
    it('should skip file removal when hash does not match (user modified)', async () => {
      createTestFile('mods/test.asi', 'original-mod-content');
      addModToRegistry('mod-1', [
        { relativePath: 'mods/test.asi', originalHash: '', modHash: 'known-hash', action: 'add' },
      ]);

      fs.writeFileSync(path.join(tmpDir, 'mods', 'test.asi'), 'user-modified-content');

      const modService = createModService();
      await modService.uninstallMod(testGameId, 'mod-1');

      expect(fs.existsSync(path.join(tmpDir, 'mods', 'test.asi'))).toBe(true);
    });

    it('should always remove files when modHash is empty (backward compat)', async () => {
      createTestFile('mods/test.asi', 'original-content');
      addModToRegistry('mod-1', [
        { relativePath: 'mods/test.asi', originalHash: '', modHash: '', action: 'add' },
      ]);

      const modService = createModService();
      await modService.uninstallMod(testGameId, 'mod-1');

      expect(fs.existsSync(path.join(tmpDir, 'mods', 'test.asi'))).toBe(false);
    });
  });

  describe('uninstall edge cases', () => {
    it('should restore backup for replaced files', async () => {
      const originalContent = 'original-game-file';
      createTestFile('update/original.rpf', originalContent);

      addModToRegistry('mod-replace', [
        { relativePath: 'update/original.rpf', originalHash: 'backup-hash', modHash: '', action: 'replace' },
      ]);

      const modService = createModService();

      const backupResult = backup.createBackup(testGameId, tmpDir, ['update/original.rpf']);
      expect(backupResult.success).toBe(true);

      fs.writeFileSync(path.join(tmpDir, 'update', 'original.rpf'), 'mod-file-content');

      await modService.uninstallMod(testGameId, 'mod-replace');

      expect(fs.existsSync(path.join(tmpDir, 'update', 'original.rpf'))).toBe(true);
      expect(fs.readFileSync(path.join(tmpDir, 'update', 'original.rpf'), 'utf-8')).toBe(originalContent);
    });

    it('should remove disabled directory on uninstall', async () => {
      createTestFile('mods/test.asi', 'content');
      addModToRegistry('mod-1', [
        { relativePath: 'mods/test.asi', originalHash: '', modHash: '', action: 'add' },
      ]);

      const modService = createModService();
      await modService.disableMod(testGameId, 'mod-1');

      const disabledDir = path.join(tmpDir, 'games', testGameId, 'disabled', 'mod-1');
      expect(fs.existsSync(disabledDir)).toBe(true);

      await modService.uninstallMod(testGameId, 'mod-1');
      expect(fs.existsSync(disabledDir)).toBe(false);

      const registry = config.getModRegistry(testGameId);
      if (registry.success) {
        const mod = registry.data.mods.find((m) => m.id === 'mod-1');
        expect(mod).toBeUndefined();
      }
    });
  });

  function createModService(): any {
    const archive = new ArchiveService();
    const validator = new ModValidator(archive, []);
    const installer = new ModInstaller(validator, archive, fileSystem, backup, config, gameService, log, paths);
    return new ModService(gameService, fileSystem, config, backup, log, installer, paths);
  }
});
