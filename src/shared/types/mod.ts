import type { ModCategory } from './game';

export interface InstalledMod {
  readonly id: string;
  readonly gameId: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description?: string;
  readonly category: ModCategory;
  readonly enabled: boolean;
  readonly installedAt: string;
  readonly updatedAt: string;
  readonly files: readonly ModFile[];
  readonly sourcePath?: string;
  readonly sourceUrl?: string;
  readonly dependencies: readonly string[];
  readonly tags: readonly string[];
  readonly verified: boolean;
  readonly verifiedVersion?: string;
  readonly isCoreDependency: boolean;
  readonly thumbnailPath?: string;
}

export interface ModFile {
  readonly relativePath: string;
  readonly originalHash: string;
  readonly modHash: string;
  readonly action: 'add' | 'replace';
}

export interface ModArchive {
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description?: string;
  readonly category: ModCategory;
  readonly files: readonly ModArchiveFile[];
  readonly dependencies: readonly string[];
  readonly tags: readonly string[];
}

export interface ModArchiveFile {
  readonly relativePath: string;
  readonly hash: string;
  readonly action: 'add' | 'replace';
}

export interface ModValidation {
  readonly valid: boolean;
  readonly mod?: ModArchive;
  readonly errors: readonly string[];
}

export interface ModUpdate {
  readonly modId: string;
  readonly currentVersion: string;
  readonly latestVersion: string;
  readonly downloadUrl: string;
  readonly changelog?: string;
}

export interface ModInstallResult {
  readonly modId: string;
  readonly installedFiles: readonly string[];
  readonly conflicts: readonly ModConflict[];
}

export interface ModConflict {
  readonly filePath: string;
  readonly existingModId: string;
  readonly existingModName: string;
}
