import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Result, AppConfig } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import {
  appConfigSchema,
  gameRegistrySchema,
  modRegistrySchema,
  type AppConfigInput,
  type GameRegistryInput,
  type ModRegistryInput,
} from '../../shared/schemas/config.schema';
import type { LogService } from './log-service';

const DEFAULT_CONFIG: AppConfig = appConfigSchema.parse({});
const DEFAULT_GAME_REGISTRY: GameRegistryInput = gameRegistrySchema.parse({});

export class ConfigService {
  private readonly dataDir: string;
  private readonly log: LogService;
  private configCache: AppConfig | null = null;

  constructor(dataDir: string, log: LogService) {
    this.dataDir = dataDir;
    this.log = log;
    this.ensureDirectories();
  }

  getConfig(): Result<AppConfig> {
    if (this.configCache) {
      return ok(this.configCache);
    }

    const configPath = this.getConfigPath();
    if (!fs.existsSync(configPath)) {
      this.configCache = DEFAULT_CONFIG;
      const writeResult = this.writeConfig(DEFAULT_CONFIG);
      if (!writeResult.success) {
        return writeResult;
      }
      return ok(DEFAULT_CONFIG);
    }

    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      const validated = appConfigSchema.parse(parsed);
      this.configCache = validated;
      return ok(validated);
    } catch (error) {
      this.log.error('ConfigService', 'Failed to read config, using defaults', error as Error);
      if (error instanceof z.ZodError) {
        return err(
          createError('CONFIG_VALIDATION_FAILED', 'Config file has invalid format', {
            details: error.errors,
            recoverable: true,
          }),
        );
      }
      return err(
        createError('CONFIG_READ_FAILED', 'Failed to read config file', {
          details: error,
          recoverable: true,
        }),
      );
    }
  }

  writeConfig(config: AppConfig): Result<void> {
    const configPath = this.getConfigPath();
    try {
      const validated = appConfigSchema.parse(config);
      const tempPath = `${configPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(validated, null, 2), 'utf-8');
      fs.renameSync(tempPath, configPath);
      this.configCache = validated;
      return ok(undefined);
    } catch (error) {
      this.log.error('ConfigService', 'Failed to write config', error as Error);
      return err(
        createError('CONFIG_WRITE_FAILED', 'Failed to write config file', {
          details: error,
          recoverable: false,
        }),
      );
    }
  }

  updateConfig(updates: Partial<AppConfigInput>): Result<AppConfig> {
    const currentResult = this.getConfig();
    if (!currentResult.success) {
      return currentResult;
    }

    const updated = { ...currentResult.data, ...updates } as AppConfig;
    const writeResult = this.writeConfig(updated);
    if (!writeResult.success) {
      return err(writeResult.error);
    }

    return ok(updated);
  }

  resetConfig(): Result<AppConfig> {
    const writeResult = this.writeConfig(DEFAULT_CONFIG);
    if (!writeResult.success) {
      return err(writeResult.error);
    }
    return ok(DEFAULT_CONFIG);
  }

  getGameRegistry(): Result<GameRegistryInput> {
    const registryPath = this.getGameRegistryPath();
    if (!fs.existsSync(registryPath)) {
      return ok(DEFAULT_GAME_REGISTRY);
    }

    try {
      const raw = fs.readFileSync(registryPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      const validated = gameRegistrySchema.parse(parsed);
      return ok(validated);
    } catch (error) {
      this.log.error('ConfigService', 'Failed to read game registry', error as Error);
      return err(
        createError('CONFIG_READ_FAILED', 'Failed to read game registry', {
          details: error,
          recoverable: true,
        }),
      );
    }
  }

  writeGameRegistry(registry: GameRegistryInput): Result<void> {
    const registryPath = this.getGameRegistryPath();
    try {
      const validated = gameRegistrySchema.parse(registry);
      const tempPath = `${registryPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(validated, null, 2), 'utf-8');
      fs.renameSync(tempPath, registryPath);
      return ok(undefined);
    } catch (error) {
      this.log.error('ConfigService', 'Failed to write game registry', error as Error);
      return err(
        createError('CONFIG_WRITE_FAILED', 'Failed to write game registry', {
          details: error,
          recoverable: false,
        }),
      );
    }
  }

  getModRegistry(gameId: string): Result<ModRegistryInput> {
    const registryPath = this.getModRegistryPath(gameId);
    if (!fs.existsSync(registryPath)) {
      return ok(modRegistrySchema.parse({ gameId }));
    }

    try {
      const raw = fs.readFileSync(registryPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      const validated = modRegistrySchema.parse(parsed);
      return ok(validated);
    } catch (error) {
      this.log.error('ConfigService', 'Failed to read mod registry', error as Error, { gameId });
      return err(
        createError('CONFIG_READ_FAILED', 'Failed to read mod registry', {
          details: error,
          recoverable: true,
        }),
      );
    }
  }

  writeModRegistry(gameId: string, registry: ModRegistryInput): Result<void> {
    const registryPath = this.getModRegistryPath(gameId);
    try {
      const validated = modRegistrySchema.parse(registry);
      const dir = path.dirname(registryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tempPath = `${registryPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(validated, null, 2), 'utf-8');
      fs.renameSync(tempPath, registryPath);
      return ok(undefined);
    } catch (error) {
      this.log.error('ConfigService', 'Failed to write mod registry', error as Error, { gameId });
      return err(
        createError('CONFIG_WRITE_FAILED', 'Failed to write mod registry', {
          details: error,
          recoverable: false,
        }),
      );
    }
  }

  private getConfigPath(): string {
    return path.join(this.dataDir, 'config.json');
  }

  private getGameRegistryPath(): string {
    return path.join(this.dataDir, 'games.json');
  }

  private getModRegistryPath(gameId: string): string {
    return path.join(this.dataDir, 'games', gameId, 'mods.json');
  }

  private ensureDirectories(): void {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'games'),
      path.join(this.dataDir, 'backups'),
      path.join(this.dataDir, 'cache', 'downloads'),
      path.join(this.dataDir, 'cache', 'catalogs', 'local'),
      path.join(this.dataDir, 'temp'),
      path.join(this.dataDir, 'logs'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
}
