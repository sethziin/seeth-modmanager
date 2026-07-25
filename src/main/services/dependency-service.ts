import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { LogService } from './log-service';
import type { FileSystemService } from './filesystem-service';
import type { ConfigService } from './config-service';

export interface Dependency {
  readonly id: string;
  readonly name: string;
  readonly type: 'mod' | 'tool' | 'library';
  readonly required: boolean;
  readonly version?: string;
  readonly description?: string;
  readonly downloadUrl?: string;
  readonly detectPath?: string;
  readonly detectFiles?: readonly string[];
}

export interface DependencyCheckResult {
  readonly satisfied: boolean;
  readonly missing: readonly Dependency[];
  readonly warnings: readonly Dependency[];
}

interface DependencyRegistry {
  readonly version: number;
  readonly dependencies: Record<string, DependencyState>;
}

interface DependencyState {
  readonly name: string;
  readonly type: string;
  readonly installed: boolean;
  readonly detectedAt?: string;
  readonly detectedVersion?: string;
  readonly installPath?: string;
}

export class DependencyService {
  private readonly log: LogService;
  private readonly fileSystem: FileSystemService;
  private readonly config: ConfigService;
  private readonly dataDir: string;
  private readonly gameDependencies = new Map<string, Dependency[]>();

  constructor(log: LogService, fileSystem: FileSystemService, config: ConfigService, dataDir: string) {
    this.log = log;
    this.fileSystem = fileSystem;
    this.config = config;
    this.dataDir = dataDir;
  }

  registerGameDependencies(gameId: string, deps: readonly Dependency[]): void {
    this.gameDependencies.set(gameId, [...deps]);
    this.log.info('DependencyService', `Registered ${deps.length} dependencies for ${gameId}`);
  }

  getGameDependencies(gameId: string): readonly Dependency[] {
    return this.gameDependencies.get(gameId) ?? [];
  }

  async scanForTools(gameId: string, installPath: string): Promise<Result<void>> {
    const regResult = this.readRegistry();
    if (!regResult.success) return err(regResult.error);

    const registry = regResult.data;
    const gameDeps = this.gameDependencies.get(gameId) ?? [];

    for (const dep of gameDeps) {
      if (dep.type !== 'tool' && dep.type !== 'library') continue;

      let detected = false;
      let detectedVersion: string | undefined;
      let detectedPath: string | undefined;

      if (dep.detectFiles) {
        for (const file of dep.detectFiles) {
          const filePath = path.join(installPath, file);
          if (fs.existsSync(filePath)) {
            detected = true;
            detectedPath = filePath;
            break;
          }
        }
      }

      if (dep.detectPath && !detected) {
        const dirPath = path.join(installPath, dep.detectPath);
        if (fs.existsSync(dirPath)) {
          detected = true;
          detectedPath = dirPath;
        }
      }

      registry.dependencies[dep.id] = {
        name: dep.name,
        type: dep.type,
        installed: detected,
        detectedAt: detected ? new Date().toISOString() : undefined,
        detectedVersion,
        installPath: detectedPath,
      };
    }

    return this.writeRegistry(registry);
  }

  async checkModDependencies(
    gameId: string,
    modDeps: readonly { id: string; name: string; required?: boolean }[],
  ): Promise<Result<DependencyCheckResult>> {
    const regResult = this.readRegistry();
    if (!regResult.success) return err(regResult.error);

    const registry = regResult.data;
    const missing: Dependency[] = [];
    const warnings: Dependency[] = [];

    const gameDeps = this.gameDependencies.get(gameId) ?? [];

    for (const modDep of modDeps) {
      const depState = registry.dependencies[modDep.id];
      const gameDep = gameDeps.find((d) => d.id === modDep.id);

      if (!depState?.installed) {
        const info: Dependency = gameDep ?? {
          id: modDep.id,
          name: modDep.name,
          type: 'mod',
          required: modDep.required ?? true,
        };

        if (info.required) {
          missing.push(info);
        } else {
          warnings.push(info);
        }
      }
    }

    return ok({
      satisfied: missing.length === 0,
      missing,
      warnings,
    });
  }

  async getDependents(gameId: string, modId: string): Promise<Result<readonly string[]>> {
    const modRegistryResult = this.config.getModRegistry(gameId);
    if (!modRegistryResult.success) return ok([]);

    const dependents: string[] = [];
    for (const installed of modRegistryResult.data.mods) {
      if (installed.dependencies.includes(modId)) {
        dependents.push(installed.name);
      }
    }

    return ok(dependents);
  }

  private readRegistry(): Result<DependencyRegistry> {
    try {
      const filePath = this.getRegistryPath();
      if (!fs.existsSync(filePath)) {
        return ok({ version: 1, dependencies: {} });
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      return ok(JSON.parse(raw) as DependencyRegistry);
    } catch (error) {
      return err(
        createError('CONFIG_READ_FAILED', 'Failed to read dependency registry', {
          details: error,
          recoverable: true,
        }),
      );
    }
  }

  private writeRegistry(registry: DependencyRegistry): Result<void> {
    try {
      const filePath = this.getRegistryPath();
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(registry, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);
      return ok(undefined);
    } catch (error) {
      return err(
        createError('CONFIG_WRITE_FAILED', 'Failed to write dependency registry', {
          details: error,
          recoverable: false,
        }),
      );
    }
  }

  private getRegistryPath(): string {
    return path.join(this.dataDir, 'dependencies.json');
  }
}
