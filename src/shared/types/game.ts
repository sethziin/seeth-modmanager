export type Platform = 'steam' | 'epic' | 'rockstar' | 'gog' | 'manual';

export interface DetectedGame {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly slug: string;
  readonly installPath: string;
  readonly platform: Platform;
  readonly detectedAt: string;
  readonly coverUrl?: string;
}

export interface GameInstallation {
  readonly path: string;
  readonly platform: Platform;
  readonly isValid: boolean;
  readonly gameVersion?: string;
}

export interface GameDetails {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly slug: string;
  readonly installPath: string;
  readonly platform: Platform;
  readonly gameVersion: string;
  readonly detectedAt: string;
  readonly lastPlayed?: string;
  readonly configured: boolean;
  readonly modCount: number;
  readonly enabledModCount: number;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface GameDependency {
  readonly id: string;
  readonly name: string;
  readonly required: boolean;
  readonly description: string;
  readonly downloadUrl?: string;
}

export interface ModCategory {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly color?: string;
}
