import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { ModArchive, ModArchiveFile } from '../../shared/types/mod';
import type { ModCategory } from '../../shared/types/game';
import type { ArchiveService } from '../services/archive-service';

export interface ModManifestSchema {
  readonly manifestVersion: number;
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description?: string;
  readonly category: string;
  readonly tags?: readonly string[];
  readonly thumbnail?: string;
  readonly gameId: string;
  readonly minGameVersion?: string;
  readonly maxGameVersion?: string;
  readonly verifiedGameVersion?: string;
  readonly dependencies?: readonly ModManifestDependency[];
  readonly conflicts?: readonly string[];
  readonly files: readonly ModManifestFileEntry[];
  readonly installInstructions?: string;
  readonly sourceUrl?: string;
}

export interface ModManifestDependency {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly required: boolean;
  readonly downloadUrl?: string;
  readonly type?: 'mod' | 'tool' | 'library';
}

export interface ModManifestFileEntry {
  readonly source: string;
  readonly destination: string;
  readonly action: 'add' | 'replace';
  readonly hash?: string;
}

export interface ManifestValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface ManifestResult {
  readonly manifest: ModManifestSchema | null;
  readonly fallback: boolean;
}

export class ManifestReader {
  private readonly archive: ArchiveService;
  private readonly validCategories: readonly ModCategory[];

  constructor(archive: ArchiveService, validCategories: readonly ModCategory[]) {
    this.archive = archive;
    this.validCategories = validCategories;
  }

  findAndParse(archivePath: string): Promise<Result<ManifestResult>> {
    const manifestResult = this.archive.findManifest(archivePath);
    if (!manifestResult.success) {
      return Promise.resolve(err(manifestResult.error));
    }

    if (!manifestResult.data.found) {
      return Promise.resolve(ok({ manifest: null, fallback: true }));
    }

    try {
      const parsed = JSON.parse(manifestResult.data.content) as Record<string, unknown>;
      const manifest = this.validateSchema(parsed);
      if (!manifest.valid) {
        return Promise.resolve(
          err(
            createError('MOD_INVALID_ARCHIVE', 'Invalid mod manifest', {
              details: { errors: manifest.errors },
              recoverable: false,
            }),
          ),
        );
      }

      return Promise.resolve(ok({ manifest: parsed as unknown as ModManifestSchema, fallback: false }));
    } catch {
      return Promise.resolve(
        err(
          createError('MOD_INVALID_ARCHIVE', 'Failed to parse mod manifest JSON', {
            recoverable: false,
          }),
        ),
      );
    }
  }

  validateSchema(raw: Record<string, unknown>): ManifestValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (raw.manifestVersion === undefined) {
      errors.push('Missing required field: manifestVersion');
    } else if (typeof raw.manifestVersion !== 'number') {
      errors.push('manifestVersion must be a number');
    } else if (raw.manifestVersion !== 1) {
      warnings.push(`Unsupported manifest version: ${String(raw.manifestVersion)}. Expected: 1`);
    }

    const requiredStringFields = ['name', 'version', 'author', 'category', 'gameId'] as const;
    for (const field of requiredStringFields) {
      const val = raw[field];
      if (val === undefined || val === null) {
        errors.push(`Missing required field: ${field}`);
      } else if (typeof val !== 'string' || val.trim().length === 0) {
        errors.push(`${field} must be a non-empty string`);
      }
    }

    if (raw.id !== undefined && (typeof raw.id !== 'string' || raw.id.trim().length === 0)) {
      errors.push('id must be a non-empty string');
    }

    if (raw.description !== undefined && typeof raw.description !== 'string') {
      errors.push('description must be a string');
    }

    const category = raw.category;
    if (typeof category === 'string' && this.validCategories.length > 0) {
      const valid = this.validCategories.some((c) => c.id === category);
      if (!valid) {
        warnings.push(`Unknown category: "${category}". Valid categories: ${this.validCategories.map((c) => c.id).join(', ')}`);
      }
    }

    if (raw.files === undefined) {
      errors.push('Missing required field: files');
    } else if (!Array.isArray(raw.files)) {
      errors.push('files must be an array');
    } else if (raw.files.length === 0) {
      errors.push('files array must not be empty');
    } else {
      for (let i = 0; i < raw.files.length; i++) {
        const file = raw.files[i] as Record<string, unknown>;
        if (!file.source || typeof file.source !== 'string') {
          errors.push(`files[${i}].source is required and must be a string`);
        }
        if (!file.destination || typeof file.destination !== 'string') {
          errors.push(`files[${i}].destination is required and must be a string`);
        }
        if (file.action !== undefined && file.action !== 'add' && file.action !== 'replace') {
          errors.push(`files[${i}].action must be "add" or "replace"`);
        }
      }
    }

    if (raw.dependencies !== undefined) {
      if (!Array.isArray(raw.dependencies)) {
        errors.push('dependencies must be an array');
      } else {
        for (let i = 0; i < raw.dependencies.length; i++) {
          const dep = raw.dependencies[i] as Record<string, unknown>;
          if (!dep.id || typeof dep.id !== 'string') {
            errors.push(`dependencies[${i}].id is required`);
          }
          if (!dep.name || typeof dep.name !== 'string') {
            errors.push(`dependencies[${i}].name is required`);
          }
        }
      }
    }

    if (raw.tags !== undefined && !Array.isArray(raw.tags)) {
      errors.push('tags must be an array');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  buildModArchive(manifest: ModManifestSchema, availableFiles: readonly string[]): ModArchive {
    const categoryMatch = this.validCategories.find((c) => c.id === manifest.category);
    const category: ModCategory = categoryMatch ?? {
      id: manifest.category,
      name: manifest.category,
      icon: 'extension',
    };

    const files: ModArchiveFile[] = manifest.files
      .filter((f) => availableFiles.includes(f.source))
      .map((f) => ({
        relativePath: f.destination,
        hash: f.hash ?? '',
        action: f.action,
      }));

    return {
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      description: manifest.description,
      category,
      files,
      dependencies: manifest.dependencies?.map((d) => d.id) ?? [],
      tags: manifest.tags ? [...manifest.tags] : [],
    };
  }

  buildFlatModArchive(availableFiles: readonly string[]): ModArchive {
    const files: ModArchiveFile[] = availableFiles.map((f) => ({
      relativePath: f,
      hash: '',
      action: 'add' as const,
    }));

    return {
      name: 'Unknown Mod',
      version: '0.0.0',
      author: 'Unknown',
      category: { id: 'scripts', name: 'Scripts', icon: 'code' },
      files,
      dependencies: [],
      tags: [],
    };
  }
}
