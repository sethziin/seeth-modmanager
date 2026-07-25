import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { LogService } from './log-service';
import { FileSystemService } from './filesystem-service';
import { ConfigService } from './config-service';
import { DependencyService } from './dependency-service';

describe('DependencyService', () => {
  let tmpDir: string;
  let log: LogService;
  let fileSystem: FileSystemService;
  let config: ConfigService;
  let service: DependencyService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-test-'));
    log = new LogService(path.join(tmpDir, 'logs'));
    fileSystem = new FileSystemService(log, [tmpDir]);
    config = new ConfigService(tmpDir, log);
    service = new DependencyService(log, fileSystem, config, tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('registerGameDependencies', () => {
    it('should register game-level dependencies', () => {
      service.registerGameDependencies('gtav', [
        { id: 'com.dev-c.scripthookv', name: 'ScriptHookV', type: 'tool', required: true },
      ]);
      const deps = service.getGameDependencies('gtav');
      expect(deps.length).toBe(1);
      expect(deps[0]!.id).toBe('com.dev-c.scripthookv');
    });

    it('should return empty for unknown game', () => {
      const deps = service.getGameDependencies('unknown');
      expect(deps.length).toBe(0);
    });
  });

  describe('checkModDependencies', () => {
    it('should detect missing required dependency', async () => {
      const result = await service.checkModDependencies('gtav', [
        { id: 'com.dev-c.scripthookv', name: 'ScriptHookV', required: true },
      ]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.satisfied).toBe(false);
        expect(result.data.missing.length).toBe(1);
        expect(result.data.missing[0]!.id).toBe('com.dev-c.scripthookv');
      }
    });

    it('should pass when all dependencies satisfied by registry', async () => {
      const depPath = path.join(tmpDir, 'dependencies.json');
      fs.writeFileSync(depPath, JSON.stringify({
        version: 1,
        dependencies: {
          'com.dev-c.scripthookv': {
            name: 'ScriptHookV', type: 'tool', installed: true,
            detectedAt: new Date().toISOString(),
          },
        },
      }));

      const result = await service.checkModDependencies('gtav', [
        { id: 'com.dev-c.scripthookv', name: 'ScriptHookV', required: true },
      ]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.satisfied).toBe(true);
      }
    });

    it('should handle optional dependencies as warnings', async () => {
      const result = await service.checkModDependencies('gtav', [
        { id: 'com.optional.mod', name: 'Optional Mod', required: false },
      ]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.satisfied).toBe(true);
        expect(result.data.warnings.length).toBe(1);
      }
    });
  });

  describe('getDependents', () => {
    it('should return empty when no mods depend on the given modId', async () => {
      const gameRegistry = { version: 1 as const, games: { 'test-game': { name: 'Test', installPath: tmpDir, platform: 'manual', detectedAt: new Date().toISOString(), gameVersion: '1.0', configured: true } } };
      config.writeGameRegistry(gameRegistry);

      const modRegistry = {
        version: 1 as const,
        gameId: 'test-game',
        mods: [
          { id: 'mod-a', name: 'Mod A', version: '1.0', author: 'T', category: 'scripts', enabled: true, installedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), files: [], dependencies: [], tags: [], verified: false, isCoreDependency: false },
          { id: 'mod-b', name: 'Mod B', version: '1.0', author: 'T', category: 'scripts', enabled: true, installedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), files: [], dependencies: [], tags: [], verified: false, isCoreDependency: false },
        ],
      };
      config.writeModRegistry('test-game', modRegistry);

      const result = await service.getDependents('test-game', 'mod-c');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });

    it('should return names of mods that depend on the given modId', async () => {
      const gameRegistry = { version: 1 as const, games: { 'test-game': { name: 'Test', installPath: tmpDir, platform: 'manual', detectedAt: new Date().toISOString(), gameVersion: '1.0', configured: true } } };
      config.writeGameRegistry(gameRegistry);

      const modRegistry = {
        version: 1 as const,
        gameId: 'test-game',
        mods: [
          { id: 'mod-a', name: 'Mod A', version: '1.0', author: 'T', category: 'scripts', enabled: true, installedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), files: [], dependencies: ['core-lib'], tags: [], verified: false, isCoreDependency: false },
          { id: 'mod-b', name: 'Mod B', version: '1.0', author: 'T', category: 'scripts', enabled: true, installedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), files: [], dependencies: ['core-lib'], tags: [], verified: false, isCoreDependency: false },
        ],
      };
      config.writeModRegistry('test-game', modRegistry);

      const result = await service.getDependents('test-game', 'core-lib');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('Mod A');
        expect(result.data).toContain('Mod B');
        expect(result.data.length).toBe(2);
      }
    });
  });
});
