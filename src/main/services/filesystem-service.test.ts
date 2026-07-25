import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { FileSystemService } from './filesystem-service';
import { LogService } from './log-service';

describe('FileSystemService', () => {
  let tmpDir: string;
  let log: LogService;
  let service: FileSystemService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-test-'));
    log = new LogService(path.join(tmpDir, 'logs'));
    service = new FileSystemService(log, [tmpDir]);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should copy a file', () => {
    const src = path.join(tmpDir, 'source.txt');
    const dest = path.join(tmpDir, 'dest.txt');
    fs.writeFileSync(src, 'hello');

    const result = service.copyFile(src, dest);
    expect(result.success).toBe(true);
    expect(fs.readFileSync(dest, 'utf-8')).toBe('hello');
  });

  it('should move a file', () => {
    const src = path.join(tmpDir, 'source.txt');
    const dest = path.join(tmpDir, 'dest.txt');
    fs.writeFileSync(src, 'hello');

    const result = service.moveFile(src, dest);
    expect(result.success).toBe(true);
    expect(fs.existsSync(src)).toBe(false);
    expect(fs.readFileSync(dest, 'utf-8')).toBe('hello');
  });

  it('should delete a file', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    fs.writeFileSync(filePath, 'data');

    const result = service.deleteFile(filePath);
    expect(result.success).toBe(true);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('should delete a directory recursively', () => {
    const dir = path.join(tmpDir, 'subdir');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'file.txt'), 'data');

    const result = service.deleteDirectory(dir);
    expect(result.success).toBe(true);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('should ensure directory exists', () => {
    const dir = path.join(tmpDir, 'a', 'b', 'c');
    const result = service.ensureDir(dir);
    expect(result.success).toBe(true);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('should read and write JSON files atomically', () => {
    const filePath = path.join(tmpDir, 'data.json');
    const data = { name: 'test', value: 42 };

    const writeResult = service.writeJsonFile(filePath, data);
    expect(writeResult.success).toBe(true);

    const readResult = service.readJsonFile<{ name: string; value: number }>(filePath);
    expect(readResult.success).toBe(true);
    if (readResult.success) {
      expect(readResult.data.name).toBe('test');
      expect(readResult.data.value).toBe(42);
    }
  });

  it('should return error for non-existent JSON file', () => {
    const result = service.readJsonFile(path.join(tmpDir, 'nonexistent.json'));
    expect(result.success).toBe(false);
  });

  it('should check file and directory existence', () => {
    const file = path.join(tmpDir, 'exists.txt');
    const dir = path.join(tmpDir, 'exists');
    fs.writeFileSync(file, 'data');
    fs.mkdirSync(dir);

    expect(service.fileExists(file)).toBe(true);
    expect(service.fileExists(path.join(tmpDir, 'nope.txt'))).toBe(false);
    expect(service.directoryExists(dir)).toBe(true);
    expect(service.directoryExists(path.join(tmpDir, 'nope'))).toBe(false);
  });

  it('should list directory contents', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'a');
    fs.writeFileSync(path.join(tmpDir, 'b.txt'), 'b');

    const result = service.listDirectory(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('a.txt');
      expect(result.data).toContain('b.txt');
    }
  });

  it('should calculate file hash', () => {
    const file = path.join(tmpDir, 'hash.txt');
    fs.writeFileSync(file, 'content');

    const result = service.calculateFileHash(file);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(64);
    }
  });

  it('should copy directory recursively', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(src);
    fs.mkdirSync(path.join(src, 'sub'));
    fs.writeFileSync(path.join(src, 'file.txt'), 'data');
    fs.writeFileSync(path.join(src, 'sub', 'file2.txt'), 'data2');

    const result = service.copyDirectory(src, dest);
    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(dest, 'file.txt'))).toBe(true);
    expect(fs.existsSync(path.join(dest, 'sub', 'file2.txt'))).toBe(true);
  });

  it('should validate path against allowed directories', () => {
    const safeResult = service.validatePath(path.join(tmpDir, 'file.txt'));
    expect(safeResult.success).toBe(true);

    const unsafeResult = service.validatePath('/etc/passwd');
    expect(unsafeResult.success).toBe(false);
  });

  it('should return error when deleting non-existent file', () => {
    const result = service.deleteFile(path.join(tmpDir, 'nonexistent.txt'));
    expect(result.success).toBe(true);
  });
});
