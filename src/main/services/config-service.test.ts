import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ConfigService } from './config-service';
import { LogService } from './log-service';
import { appConfigSchema } from '../../shared/schemas/config.schema';

describe('ConfigService', () => {
  let dataDir: string;
  let log: LogService;
  let service: ConfigService;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    log = new LogService(path.join(dataDir, 'logs'));
    service = new ConfigService(dataDir, log);
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it('should create data directories on initialization', () => {
    expect(fs.existsSync(path.join(dataDir, 'games'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, 'cache', 'downloads'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, 'logs'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, 'temp'))).toBe(true);
  });

  it('should return default config when no config file exists', () => {
    const result = service.getConfig();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.general.theme).toBe('dark');
      expect(result.data.downloads.maxConcurrent).toBe(3);
    }
  });

  it('should create config file on first read', () => {
    service.getConfig();
    expect(fs.existsSync(path.join(dataDir, 'config.json'))).toBe(true);
  });

  it('should write and read config', () => {
    const config = appConfigSchema.parse({});
    const writeResult = service.writeConfig(config);
    expect(writeResult.success).toBe(true);

    const readResult = service.getConfig();
    expect(readResult.success).toBe(true);
    if (readResult.success) {
      expect(readResult.data.general.theme).toBe('dark');
    }
  });

  it('should update specific config fields', () => {
    const result = service.updateConfig({ general: { language: 'pt', autoCheckUpdates: false, updateCheckInterval: 86400000, startMinimized: false, minimizeToTray: true, theme: 'dark' } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.general.language).toBe('pt');
    }
  });

  it('should reset config to defaults', () => {
    service.updateConfig({ general: { language: 'pt', autoCheckUpdates: false, updateCheckInterval: 86400000, startMinimized: false, minimizeToTray: true, theme: 'dark' } });
    const result = service.resetConfig();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.general.language).toBe('en');
    }
  });

  it('should handle corrupted config file gracefully', () => {
    fs.writeFileSync(path.join(dataDir, 'config.json'), 'not valid json {{{', 'utf-8');
    const result = service.getConfig();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.recoverable).toBe(true);
    }
  });

  it('should return default game registry when none exists', () => {
    const result = service.getGameRegistry();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.games).toEqual({});
    }
  });

  it('should write and read game registry', () => {
    const registry = {
      version: 1 as const,
      games: {
        gtav: {
          name: 'Grand Theft Auto V',
          installPath: 'C:\\Games\\GTA5',
          platform: 'steam',
          detectedAt: '2026-07-24T00:00:00Z',
          gameVersion: 'v1.0.3028.0',
          configured: true,
        },
      },
    };

    const writeResult = service.writeGameRegistry(registry);
    expect(writeResult.success).toBe(true);

    const readResult = service.getGameRegistry();
    expect(readResult.success).toBe(true);
    if (readResult.success) {
      expect(readResult.data.games.gtav?.name).toBe('Grand Theft Auto V');
    }
  });

  it('should return empty mod registry for unknown game', () => {
    const result = service.getModRegistry('gtav');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mods).toEqual([]);
      expect(result.data.gameId).toBe('gtav');
    }
  });

  it('should write and read mod registry', () => {
    const registry = {
      version: 1 as const,
      gameId: 'gtav',
      mods: [
        {
          id: 'test-mod-1',
          name: 'Test Mod',
          version: '1.0.0',
          author: 'Test Author',
          category: 'scripts',
          enabled: true,
          installedAt: '2026-07-24T00:00:00Z',
          updatedAt: '2026-07-24T00:00:00Z',
          files: [],
          dependencies: [],
          tags: [],
          verified: false,
          isCoreDependency: false,
        },
      ],
    };

    const writeResult = service.writeModRegistry('gtav', registry);
    expect(writeResult.success).toBe(true);

    const readResult = service.getModRegistry('gtav');
    expect(readResult.success).toBe(true);
    if (readResult.success) {
      expect(readResult.data.mods).toHaveLength(1);
      expect(readResult.data.mods[0]?.name).toBe('Test Mod');
    }
  });
});
