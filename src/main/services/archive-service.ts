import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';

export interface ExtractedFile {
  readonly entryName: string;
  readonly content: Buffer;
}

export class ArchiveService {
  validateArchive(archivePath: string): Result<{ readonly isValid: boolean; readonly entryCount: number }> {
    try {
      if (!fs.existsSync(archivePath)) {
        return err(
          createError('ARCHIVE_NOT_FOUND', 'Archive file does not exist', {
            details: { path: archivePath },
            recoverable: false,
          }),
        );
      }

      const zip = new AdmZip(archivePath);
      const entries = zip.getEntries();

      return ok({ isValid: true, entryCount: entries.length });
    } catch (error) {
      return err(
        createError('ARCHIVE_INVALID', 'Failed to read archive', {
          details: error instanceof Error ? error.message : String(error),
          recoverable: false,
        }),
      );
    }
  }

  listFiles(archivePath: string): Result<readonly string[]> {
    try {
      const zip = new AdmZip(archivePath);
      const entries = zip.getEntries();

      const files = entries
        .filter((e) => !e.isDirectory)
        .map((e) => this.sanitizeEntryPath(e.entryName))
        .filter((p): p is string => p !== null);

      return ok(files);
    } catch (error) {
      return err(
        createError('ARCHIVE_READ_FAILED', 'Failed to list archive contents', {
          details: error instanceof Error ? error.message : String(error),
          recoverable: false,
        }),
      );
    }
  }

  extractAll(archivePath: string, destDir: string): Result<readonly string[]> {
    try {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const zip = new AdmZip(archivePath);
      const entries = zip.getEntries();

      const extracted: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        const safePath = this.sanitizeEntryPath(entry.entryName);
        if (!safePath) continue;

        const targetPath = path.join(destDir, safePath);
        const targetDir = path.dirname(targetPath);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const data = entry.getData();
        fs.writeFileSync(targetPath, data);
        extracted.push(safePath);
      }

      return ok(extracted);
    } catch (error) {
      return err(
        createError('EXTRACTION_FAILED', 'Failed to extract archive', {
          details: error instanceof Error ? error.message : String(error),
          recoverable: false,
        }),
      );
    }
  }

  readFile(archivePath: string, filePath: string): Result<Buffer> {
    try {
      const zip = new AdmZip(archivePath);
      const safePath = this.sanitizeEntryPath(filePath);
      if (!safePath) {
        return err(
          createError('PATH_TRAVERSAL_DETECTED', 'Invalid file path in archive', {
            details: { path: filePath },
            recoverable: false,
          }),
        );
      }

      const entry = zip.getEntry(safePath);
      if (!entry) {
        return err(
          createError('FILE_NOT_FOUND', 'File not found in archive', {
            details: { path: safePath },
            recoverable: false,
          }),
        );
      }

      const data = entry.getData();
      if (!data) {
        return err(
          createError('FILE_READ_FAILED', 'Failed to read file from archive', {
            details: { path: safePath },
            recoverable: false,
          }),
        );
      }

      return ok(data);
    } catch (error) {
      return err(
        createError('ARCHIVE_READ_FAILED', 'Failed to read file from archive', {
          details: error instanceof Error ? error.message : String(error),
          recoverable: false,
        }),
      );
    }
  }

  findManifest(archivePath: string): Result<{ readonly content: string; readonly found: boolean }> {
    try {
      const zip = new AdmZip(archivePath);
      const entry = zip.getEntry('mod.json');
      if (!entry) {
        return ok({ content: '', found: false });
      }

      const data = entry.getData();
      if (!data) {
        return ok({ content: '', found: false });
      }

      const text = data.toString('utf-8');
      return ok({ content: text, found: true });
    } catch (error) {
      return err(
        createError('MANIFEST_READ_FAILED', 'Failed to read mod manifest from archive', {
          details: error instanceof Error ? error.message : String(error),
          recoverable: true,
        }),
      );
    }
  }

  testIntegrity(archivePath: string): Result<boolean> {
    try {
      const zip = new AdmZip(archivePath);
      const isValid = zip.test();
      return ok(isValid);
    } catch (error) {
      return err(
        createError('ARCHIVE_CORRUPT', 'Archive integrity check failed', {
          details: error instanceof Error ? error.message : String(error),
          recoverable: false,
        }),
      );
    }
  }

  private sanitizeEntryPath(entryPath: string): string | null {
    if (!entryPath || entryPath.length === 0) {
      return null;
    }

    if (entryPath.includes('\0')) {
      return null;
    }

    const normalized = path.normalize(entryPath).replace(/\\/g, '/');

    if (normalized.startsWith('..') || normalized.includes('/../') || normalized.endsWith('/..')) {
      return null;
    }

    if (normalized.startsWith('/')) {
      return null;
    }

    if (/^[A-Za-z]:[/\\]/.test(normalized)) {
      return null;
    }

    if (path.isAbsolute(normalized)) {
      return null;
    }

    return normalized;
  }
}
