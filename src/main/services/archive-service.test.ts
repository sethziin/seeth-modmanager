import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ArchiveService } from './archive-service';

describe('ArchiveService', () => {
  let tmpDir: string;
  let service: ArchiveService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-test-'));
    service = new ArchiveService();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createTestZip(files: Record<string, string>): string {
    const zipPath = path.join(tmpDir, 'test.zip');
    const zip = new AdmZip();
    for (const [entryName, content] of Object.entries(files)) {
      zip.addFile(entryName, Buffer.from(content));
    }
    zip.writeZip(zipPath);
    return zipPath;
  }

  describe('validateArchive', () => {
    it('should return error when file does not exist', () => {
      const result = service.validateArchive(path.join(tmpDir, 'nonexistent.zip'));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ARCHIVE_NOT_FOUND');
      }
    });

    it('should validate a valid zip archive', () => {
      const zipPath = createTestZip({ 'file.txt': 'hello' });
      const result = service.validateArchive(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.entryCount).toBe(1);
      }
    });

    it('should return error for a non-zip file', () => {
      const invalidPath = path.join(tmpDir, 'not-a-zip.bin');
      fs.writeFileSync(invalidPath, 'not a zip file');
      const result = service.validateArchive(invalidPath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ARCHIVE_INVALID');
      }
    });
  });

  describe('listFiles', () => {
    it('should list files in archive', () => {
      const zipPath = createTestZip({
        'file1.txt': 'one',
        'subdir/file2.txt': 'two',
      });
      const result = service.listFiles(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('file1.txt');
        expect(result.data).toContain('subdir/file2.txt');
        expect(result.data.length).toBe(2);
      }
    });

    it('should return empty list for empty archive', () => {
      const zipPath = createTestZip({});
      const result = service.listFiles(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });
  });

  describe('readFile', () => {
    it('should read a file from archive', () => {
      const zipPath = createTestZip({ 'hello.txt': 'world' });
      const result = service.readFile(zipPath, 'hello.txt');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString('utf-8')).toBe('world');
      }
    });

    it('should return error for missing file', () => {
      const zipPath = createTestZip({ 'hello.txt': 'world' });
      const result = service.readFile(zipPath, 'missing.txt');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_NOT_FOUND');
      }
    });

    it('should block path traversal attempts', () => {
      const zipPath = createTestZip({ 'hello.txt': 'world' });
      const result = service.readFile(zipPath, '../etc/passwd');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PATH_TRAVERSAL_DETECTED');
      }
    });
  });

  describe('extractAll', () => {
    it('should extract all files to destination', () => {
      const zipPath = createTestZip({
        'file1.txt': 'content1',
        'sub/file2.txt': 'content2',
      });
      const destDir = path.join(tmpDir, 'extracted');
      const result = service.extractAll(zipPath, destDir);
      expect(result.success).toBe(true);
      expect(fs.readFileSync(path.join(destDir, 'file1.txt'), 'utf-8')).toBe('content1');
      expect(fs.readFileSync(path.join(destDir, 'sub', 'file2.txt'), 'utf-8')).toBe('content2');
    });

    it('should create destination directory if it does not exist', () => {
      const zipPath = createTestZip({ 'file.txt': 'data' });
      const destDir = path.join(tmpDir, 'new-dir', 'extracted');
      const result = service.extractAll(zipPath, destDir);
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(destDir, 'file.txt'))).toBe(true);
    });

    it('should return list of extracted file paths', () => {
      const zipPath = createTestZip({ 'a.txt': 'a', 'b.txt': 'b' });
      const destDir = path.join(tmpDir, 'out');
      const result = service.extractAll(zipPath, destDir);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('a.txt');
        expect(result.data).toContain('b.txt');
        expect(result.data.length).toBe(2);
      }
    });
  });

  describe('findManifest', () => {
    it('should find and read mod.json manifest', () => {
      const manifest = JSON.stringify({ name: 'Test Mod', version: '1.0.0' });
      const zipPath = createTestZip({ 'mod.json': manifest, 'file.txt': 'data' });
      const result = service.findManifest(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.found).toBe(true);
        expect(result.data.content).toBe(manifest);
      }
    });

    it('should return found=false when no manifest exists', () => {
      const zipPath = createTestZip({ 'file.txt': 'data' });
      const result = service.findManifest(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.found).toBe(false);
        expect(result.data.content).toBe('');
      }
    });
  });

  describe('testIntegrity', () => {
    it('should return true for valid archive', () => {
      const zipPath = createTestZip({ 'file.txt': 'data' });
      const result = service.testIntegrity(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });
  });

  describe('security - path traversal prevention', () => {
    it('should block directory traversal in extractAll', () => {
      const zipPath = path.join(tmpDir, 'traversal.zip');
      const zip = new AdmZip();
      zip.addFile('../outside.txt', Buffer.from('evil'));
      zip.writeZip(zipPath);

      const destDir = path.join(tmpDir, 'safe');
      const result = service.extractAll(zipPath, destDir);
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'outside.txt'))).toBe(false);
    });

    it('should block absolute paths (Windows)', () => {
      const zipPath = path.join(tmpDir, 'absolute-win.zip');
      const zip = new AdmZip();
      zip.addFile('C:\\windows\\system32\\config\\sam', Buffer.from('evil'));
      zip.writeZip(zipPath);

      const result = service.listFiles(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });

    it('should treat root-prefixed entries as safe relative paths', () => {
      const zipPath = path.join(tmpDir, 'root-prefixed.zip');
      const zip = new AdmZip();
      zip.addFile('/mods/file.asi', Buffer.from('content'));
      zip.writeZip(zipPath);

      const result = service.listFiles(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1);
        expect(result.data[0]).toBe('mods/file.asi');
      }
    });

    it('should block null bytes in entry name', () => {
      const zipPath = path.join(tmpDir, 'nullbyte.zip');
      const zip = new AdmZip();
      zip.addFile('safe.txt\0.exe', Buffer.from('evil'));
      zip.writeZip(zipPath);

      const result = service.listFiles(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });
  });
});
