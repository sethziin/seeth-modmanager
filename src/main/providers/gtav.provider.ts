import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type {
  GameInstallation,
  ValidationResult,
  GameDependency,
  ModCategory,
  DetectedGame,
  GameDetails,
} from '../../shared/types/game';
import type { ModArchive, ModInstallResult, ModValidation, InstalledMod } from '../../shared/types/mod';
import type { GameProvider } from '../../shared/types/provider';
import type { LogService } from '../services/log-service';
import type { ModValidator } from '../services/mod-validator';

const GTA_V_CATEGORIES: readonly ModCategory[] = [
  { id: 'graphics', name: 'Graphics', icon: 'palette' },
  { id: 'gameplay', name: 'Gameplay', icon: 'sports_esports' },
  { id: 'vehicles', name: 'Vehicles', icon: 'directions_car' },
  { id: 'characters', name: 'Characters', icon: 'person' },
  { id: 'maps', name: 'Maps', icon: 'map' },
  { id: 'scripts', name: 'Scripts', icon: 'code' },
  { id: 'tools', name: 'Tools', icon: 'build' },
  { id: 'audio', name: 'Audio', icon: 'volume_up' },
  { id: 'ui', name: 'UI', icon: 'web' },
];

const GTA_V_DEPENDENCIES: readonly GameDependency[] = [
  {
    id: 'scripthookv',
    name: 'ScriptHookV',
    required: true,
    description: 'Required for .asi mods',
    downloadUrl: 'http://www.dev-c.com/tv/scripthookv/',
  },
  {
    id: 'scripthookvdotnet',
    name: 'ScriptHookVDotNet',
    required: false,
    description: 'Required for .NET script mods',
    downloadUrl: 'https://github.com/crosire/scripthookvdotnet/releases',
  },
  {
    id: 'openiv',
    name: 'OpenIV',
    required: false,
    description: 'Required for RPF modifications',
    downloadUrl: 'https://openiv.com/',
  },
];

export class GTAVProvider implements GameProvider {
  readonly id = 'gtav';
  readonly name = 'Grand Theft Auto V';
  readonly shortName = 'GTA V';
  readonly slug = 'gtav';
  readonly supportedPlatforms = ['steam', 'epic', 'rockstar'];
  readonly coverUrl = '/covers/gta-v-cover.jpg';

  private readonly log: LogService;
  private validator: ModValidator | null = null;

  constructor(log: LogService, validator?: ModValidator) {
    this.log = log;
    if (validator) {
      this.validator = validator;
    }
  }

  setValidator(validator: ModValidator): void {
    this.validator = validator;
  }

  async detectInstallation(): Promise<GameInstallation | null> {
    const registryPaths = [
      'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Rockstar Games\\Grand Theft Auto V',
      'HKEY_LOCAL_MACHINE\\SOFTWARE\\Rockstar Games\\Grand Theft Auto V',
    ];

    for (const regPath of registryPaths) {
      const result = this.readRegistryKey(regPath);
      if (result) {
        return result;
      }
    }

    const steamPath = this.findInSteamLibrary();
    if (steamPath) {
      return steamPath;
    }

    const epicPath = this.findInEpicGames();
    if (epicPath) {
      return epicPath;
    }

    this.log.debug('GTAVProvider', 'No GTA V installation detected');
    return null;
  }

  async validateInstallation(installPath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const exePath = `${installPath}\\GTA5.exe`;
    if (!this.fileExists(exePath)) {
      errors.push('GTA5.exe not found');
    }

    const launcherPath = `${installPath}\\GTAVLauncher.exe`;
    if (!this.fileExists(launcherPath)) {
      warnings.push('GTAVLauncher.exe not found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async getGameVersion(installPath: string): Promise<string> {
    const exePath = `${installPath}\\GTA5.exe`;
    if (!this.fileExists(exePath)) {
      return 'unknown';
    }

    try {
      const { execSync } = require('node:child_process') as typeof import('node:child_process');
      const output = execSync(`powershell -Command "(Get-Item '${exePath}').VersionInfo.ProductVersion"`, {
        encoding: 'utf-8',
        timeout: 5000,
      });
      return output.trim() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  getModDirectory(installPath: string): string {
    return `${installPath}\\mods`;
  }

  getModCategories(): readonly ModCategory[] {
    return GTA_V_CATEGORIES;
  }

  getRequiredDependencies(): readonly GameDependency[] {
    return GTA_V_DEPENDENCIES;
  }

  async installMod(mod: ModArchive, installPath: string): Promise<ModInstallResult> {
    const installedFiles: string[] = [];

    for (const file of mod.files) {
      const targetPath = `${installPath}\\${file.relativePath}`;
      installedFiles.push(file.relativePath);
    }

    return {
      modId: '',
      installedFiles,
      conflicts: [],
    };
  }

  async uninstallMod(mod: InstalledMod, installPath: string): Promise<void> {
    for (const file of mod.files) {
      const filePath = `${installPath}\\${file.relativePath}`;
      if (this.fileExists(filePath)) {
        try {
          const fs = require('node:fs') as typeof import('node:fs');
          fs.unlinkSync(filePath);
        } catch {
          this.log.warn('GTAVProvider', 'Failed to remove mod file', {
            filePath,
          });
        }
      }
    }
  }

  async validateMod(archivePath: string): Promise<ModValidation> {
    if (!this.validator) {
      return {
        valid: false,
        errors: ['Mod validator not configured'],
      };
    }
    const result = await this.validator.validate(archivePath);
    if (!result.success) {
      return {
        valid: false,
        errors: [result.error.message],
      };
    }
    return result.data;
  }

  private readRegistryKey(_path: string): GameInstallation | null {
    try {
      const { execSync } = require('node:child_process') as typeof import('node:child_process');
      const output = execSync(`reg query "${_path}" /v InstallLocation 2>nul`, {
        encoding: 'utf-8',
        timeout: 5000,
      });

      const match = output.match(/InstallLocation\s+REG_SZ\s+(.+)/);
      if (match?.[1]) {
        const installPath = match[1].trim();
        if (this.fileExists(`${installPath}\\GTA5.exe`)) {
          return {
            path: installPath,
            platform: 'rockstar',
            isValid: true,
          };
        }
      }
    } catch {
      // Registry key doesn't exist
    }

    return null;
  }

  private findInSteamLibrary(): GameInstallation | null {
    const steamPaths = [
      'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grand Theft Auto V',
      'D:\\SteamLibrary\\steamapps\\common\\Grand Theft Auto V',
      'E:\\SteamLibrary\\steamapps\\common\\Grand Theft Auto V',
    ];

    for (const steamPath of steamPaths) {
      if (this.fileExists(`${steamPath}\\GTA5.exe`)) {
        return {
          path: steamPath,
          platform: 'steam',
          isValid: true,
        };
      }
    }

    return null;
  }

  private findInEpicGames(): GameInstallation | null {
    try {
      const { execSync } = require('node:child_process') as typeof import('node:child_process');
      const output = execSync(
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher" /v AppDataPath 2>nul',
        { encoding: 'utf-8', timeout: 5000 },
      );

      const match = output.match(/AppDataPath\s+REG_SZ\s+(.+)/);
      if (match?.[1]) {
        const manifestPath = `${match[1].trim()}\\Manifests\\*.item`;
        // Epic detection is complex, would need glob matching
        void manifestPath;
      }
    } catch {
      // Epic not installed
    }

    return null;
  }

  private fileExists(filePath: string): boolean {
    try {
      const fs = require('node:fs') as typeof import('node:fs');
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }
}
