import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { ModValidation, ModArchive } from '../../shared/types/mod';
import type { ModCategory } from '../../shared/types/game';
import type { ArchiveService } from './archive-service';
import { ManifestReader } from '../lib/manifest-reader';

export class ModValidator {
  private readonly archive: ArchiveService;
  private readonly manifestReader: ManifestReader;

  constructor(archive: ArchiveService, validCategories: readonly ModCategory[]) {
    this.archive = archive;
    this.manifestReader = new ManifestReader(archive, validCategories);
  }

  async validate(archivePath: string): Promise<Result<ModValidation>> {
    const archiveResult = this.archive.validateArchive(archivePath);
    if (!archiveResult.success) {
      return err(
        createError('MOD_INVALID_ARCHIVE', archiveResult.error.message, {
          details: archiveResult.error.details,
          recoverable: false,
        }),
      );
    }

    const listResult = this.archive.listFiles(archivePath);
    if (!listResult.success) {
      return err(listResult.error);
    }

    const availableFiles = listResult.data;

    const manifestResult = await this.manifestReader.findAndParse(archivePath);
    if (!manifestResult.success) {
      return err(
        createError('MOD_INVALID_ARCHIVE', manifestResult.error.message, {
          details: manifestResult.error.details,
          recoverable: false,
        }),
      );
    }

    let modArchive: ModArchive;

    if (manifestResult.data.manifest) {
      modArchive = this.manifestReader.buildModArchive(manifestResult.data.manifest, availableFiles);
    } else {
      modArchive = this.manifestReader.buildFlatModArchive(availableFiles);
    }

    const integrityResult = this.archive.testIntegrity(archivePath);
    if (!integrityResult.success) {
      return err(
        createError('MOD_INVALID_ARCHIVE', 'Archive integrity check failed', {
          details: integrityResult.error.details,
          recoverable: false,
        }),
      );
    }

    const errors: string[] = [];

    if (modArchive.files.length === 0) {
      errors.push('Mod archive contains no files to install');
    }

    return ok({
      valid: errors.length === 0,
      mod: modArchive,
      errors,
    });
  }

  async validateQuick(archivePath: string): Promise<Result<boolean>> {
    const result = this.archive.validateArchive(archivePath);
    if (!result.success) {
      return err(result.error);
    }
    return ok(result.data.isValid);
  }
}
