import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { LogService } from './log-service';

export class FileSystemService {
  private readonly allowedBaseDirs: string[];
  private readonly log: LogService;

  constructor(log: LogService, allowedBaseDirs?: readonly string[]) {
    this.log = log;
    this.allowedBaseDirs = [...(allowedBaseDirs ?? [])];
  }

  addAllowedDirectory(dir: string): void {
    const resolved = path.resolve(dir);
    if (!this.allowedBaseDirs.includes(resolved)) {
      this.allowedBaseDirs.push(resolved);
    }
  }

  copyFile(source: string, destination: string): Result<void> {
    const sourceValidation = this.validatePath(source);
    if (!sourceValidation.success) return sourceValidation;

    try {
      const destDir = path.dirname(destination);
      this.ensureDir(destDir);
      fs.copyFileSync(source, destination);
      return ok(undefined);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to copy file', error as Error, {
        source,
        destination,
      });
      return err(this.mapFsError(error as Error, 'copy file'));
    }
  }

  moveFile(source: string, destination: string): Result<void> {
    const sourceValidation = this.validatePath(source);
    if (!sourceValidation.success) return sourceValidation;

    try {
      const destDir = path.dirname(destination);
      this.ensureDir(destDir);
      fs.renameSync(source, destination);
      return ok(undefined);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to move file', error as Error, {
        source,
        destination,
      });
      return err(this.mapFsError(error as Error, 'move file'));
    }
  }

  deleteFile(filePath: string): Result<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return ok(undefined);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to delete file', error as Error, { filePath });
      return err(this.mapFsError(error as Error, 'delete file'));
    }
  }

  deleteDirectory(dirPath: string): Result<void> {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      return ok(undefined);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to delete directory', error as Error, {
        dirPath,
      });
      return err(this.mapFsError(error as Error, 'delete directory'));
    }
  }

  ensureDir(dirPath: string): Result<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return ok(undefined);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to create directory', error as Error, {
        dirPath,
      });
      return err(this.mapFsError(error as Error, 'create directory'));
    }
  }

  readJsonFile<T>(filePath: string): Result<T> {
    try {
      if (!fs.existsSync(filePath)) {
        return err(
          createError('FS_FILE_NOT_FOUND', 'File not found', {
            details: { filePath },
            recoverable: false,
          }),
        );
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as T;
      return ok(data);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to read JSON file', error as Error, {
        filePath,
      });
      return err(this.mapFsError(error as Error, 'read JSON file'));
    }
  }

  writeJsonFile(filePath: string, data: unknown): Result<void> {
    try {
      const dir = path.dirname(filePath);
      this.ensureDir(dir);
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);
      return ok(undefined);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to write JSON file', error as Error, {
        filePath,
      });
      return err(this.mapFsError(error as Error, 'write JSON file'));
    }
  }

  readFile(filePath: string): Result<string> {
    try {
      if (!fs.existsSync(filePath)) {
        return err(
          createError('FS_FILE_NOT_FOUND', 'File not found', {
            details: { filePath },
            recoverable: false,
          }),
        );
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return ok(content);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to read file', error as Error, { filePath });
      return err(this.mapFsError(error as Error, 'read file'));
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  directoryExists(dirPath: string): boolean {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  listDirectory(dirPath: string): Result<readonly string[]> {
    try {
      if (!fs.existsSync(dirPath)) {
        return ok([]);
      }
      const entries = fs.readdirSync(dirPath);
      return ok(entries);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to list directory', error as Error, {
        dirPath,
      });
      return err(this.mapFsError(error as Error, 'list directory'));
    }
  }

  getDirectorySize(dirPath: string): Result<number> {
    try {
      let size = 0;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const subResult = this.getDirectorySize(fullPath);
          if (subResult.success) {
            size += subResult.data;
          }
        } else {
          size += fs.statSync(fullPath).size;
        }
      }
      return ok(size);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to get directory size', error as Error, {
        dirPath,
      });
      return err(this.mapFsError(error as Error, 'get directory size'));
    }
  }

  calculateFileHash(filePath: string): Result<string> {
    try {
      if (!fs.existsSync(filePath)) {
        return err(
          createError('FS_FILE_NOT_FOUND', 'File not found', {
            details: { filePath },
            recoverable: false,
          }),
        );
      }
      const content = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      return ok(hash);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to calculate file hash', error as Error, {
        filePath,
      });
      return err(this.mapFsError(error as Error, 'calculate file hash'));
    }
  }

  copyDirectory(source: string, destination: string): Result<void> {
    const ensureResult = this.ensureDir(destination);
    if (!ensureResult.success) return ensureResult;

    try {
      const entries = fs.readdirSync(source, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);
        if (entry.isDirectory()) {
          const subResult = this.copyDirectory(srcPath, destPath);
          if (!subResult.success) return subResult;
        } else {
          const copyResult = this.copyFile(srcPath, destPath);
          if (!copyResult.success) return copyResult;
        }
      }
      return ok(undefined);
    } catch (error) {
      this.log.error('FileSystemService', 'Failed to copy directory', error as Error, {
        source,
        destination,
      });
      return err(this.mapFsError(error as Error, 'copy directory'));
    }
  }

  validatePath(filePath: string): Result<void> {
    if (this.allowedBaseDirs.length === 0) {
      return ok(undefined);
    }

    const resolved = path.resolve(filePath);
    const isAllowed = this.allowedBaseDirs.some((base) => resolved.startsWith(base));

    if (!isAllowed) {
      return err(
        createError('FS_PERMISSION_DENIED', 'Path is outside allowed directories', {
          details: { filePath: resolved },
          recoverable: false,
        }),
      );
    }

    return ok(undefined);
  }

  private mapFsError(error: Error & { code?: string }, operation: string): ReturnType<typeof createError> {
    const code = error.code;
    if (code === 'EACCES' || code === 'EPERM') {
      return createError('FS_PERMISSION_DENIED', `Permission denied during ${operation}`, {
        recoverable: true,
        suggestion: 'Check file permissions and ensure the game is not running',
      });
    }
    if (code === 'ENOENT') {
      return createError('FS_FILE_NOT_FOUND', `File not found during ${operation}`, {
        recoverable: false,
      });
    }
    if (code === 'ENOSPC') {
      return createError('FS_DISK_FULL', 'Disk is full', {
        recoverable: true,
        suggestion: 'Free up disk space and try again',
      });
    }
    return createError('UNKNOWN_ERROR', `Failed to ${operation}: ${error.message}`, {
      details: error,
      recoverable: false,
    });
  }
}
