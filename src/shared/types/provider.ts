import type {
  GameInstallation,
  ValidationResult,
  GameDependency,
  ModCategory,
} from './game';
import type { ModArchive, ModInstallResult, ModValidation, InstalledMod } from './mod';

export interface GameProvider {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly slug: string;
  readonly supportedPlatforms: readonly string[];
  readonly coverUrl?: string;

  detectInstallation(): Promise<GameInstallation | null>;
  validateInstallation(path: string): Promise<ValidationResult>;
  getGameVersion(installPath: string): Promise<string>;
  getModDirectory(installPath: string): string;
  getModCategories(): readonly ModCategory[];
  getRequiredDependencies(): readonly GameDependency[];
  installMod(mod: ModArchive, installPath: string): Promise<ModInstallResult>;
  uninstallMod(mod: InstalledMod, installPath: string): Promise<void>;
  validateMod(archivePath: string): Promise<ModValidation>;
}
