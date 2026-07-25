import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ArchiveService } from './archive-service';
import { ModValidator } from './mod-validator';

describe('ModValidator', () => {
  let tmpDir: string;
  let archive: ArchiveService;
  let validator: ModValidator;
  const validCategories = [
    { id: 'graphics', name: 'Graphics', icon: 'palette' },
    { id: 'scripts', name: 'Scripts', icon: 'code' },
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-test-'));
    archive = new ArchiveService();
    validator = new ModValidator(archive, validCategories);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createZip(files: Record<string, string>): string {
    const zipPath = path.join(tmpDir, 'mod.zip');
    const zip = new AdmZip();
    for (const [name, content] of Object.entries(files)) {
      zip.addFile(name, Buffer.from(content));
    }
    zip.writeZip(zipPath);
    return zipPath;
  }

  describe('validate', () => {
    it('should validate a mod with manifest', async () => {
      const zipPath = createZip({
        'mod.json': JSON.stringify({
          manifestVersion: 1,
          name: 'Test Mod',
          version: '1.0.0',
          author: 'TestAuthor',
          category: 'graphics',
          gameId: 'gtav',
          files: [
            { source: 'files/test.asi', destination: 'test.asi', action: 'add' },
          ],
        }),
        'files/test.asi': 'binary-content',
      });

      const result = await validator.validate(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.mod).not.toBeUndefined();
        expect(result.data.mod!.name).toBe('Test Mod');
        expect(result.data.mod!.files.length).toBe(1);
      }
    });

    it('should validate a flat mod (no manifest)', async () => {
      const zipPath = createZip({
        'test.asi': 'content',
        'scripts/helper.asi': 'more',
      });

      const result = await validator.validate(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.mod).not.toBeUndefined();
        expect(result.data.mod!.name).toBe('Unknown Mod');
        expect(result.data.mod!.files.length).toBe(2);
      }
    });

    it('should return error for nonexistent file', async () => {
      const result = await validator.validate(path.join(tmpDir, 'nonexistent.zip'));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MOD_INVALID_ARCHIVE');
      }
    });

    it('should return error for corrupt archive', async () => {
      const corruptPath = path.join(tmpDir, 'corrupt.zip');
      fs.writeFileSync(corruptPath, 'not-a-zip-content');

      const result = await validator.validate(corruptPath);
      expect(result.success).toBe(false);
    });

    it('should return error for empty archive', async () => {
      const zipPath = createZip({});
      const result = await validator.validate(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid manifest JSON', async () => {
      const zipPath = createZip({
        'mod.json': 'not-valid-json',
        'test.asi': 'content',
      });

      const result = await validator.validate(zipPath);
      expect(result.success).toBe(false);
    });

    it('should validate a mod with multiple files', async () => {
      const zipPath = createZip({
        'mod.json': JSON.stringify({
          manifestVersion: 1,
          name: 'Multi File Mod',
          version: '2.0.0',
          author: 'Dev',
          category: 'scripts',
          gameId: 'gtav',
          files: [
            { source: 'bin/main.asi', destination: 'main.asi', action: 'add' },
            { source: 'bin/config.ini', destination: 'config.ini', action: 'replace' },
          ],
        }),
        'bin/main.asi': 'main-binary',
        'bin/config.ini': 'config-data',
      });

      const result = await validator.validate(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.mod!.files.length).toBe(2);
        expect(result.data.mod!.files[0]!.action).toBe('add');
        expect(result.data.mod!.files[1]!.action).toBe('replace');
      }
    });
  });

  describe('validateQuick', () => {
    it('should return true for valid archive', async () => {
      const zipPath = createZip({ 'file.txt': 'data' });
      const result = await validator.validateQuick(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return error for nonexistent file', async () => {
      const result = await validator.validateQuick(path.join(tmpDir, 'missing.zip'));
      expect(result.success).toBe(false);
    });
  });
});
