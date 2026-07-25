import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ArchiveService } from '../services/archive-service';
import { ManifestReader } from './manifest-reader';

describe('ManifestReader', () => {
  let tmpDir: string;
  let archive: ArchiveService;
  let reader: ManifestReader;
  const validCategories = [
    { id: 'graphics', name: 'Graphics', icon: 'palette' },
    { id: 'gameplay', name: 'Gameplay', icon: 'sports_esports' },
    { id: 'scripts', name: 'Scripts', icon: 'code' },
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'));
    archive = new ArchiveService();
    reader = new ManifestReader(archive, validCategories);
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

  const validManifest = JSON.stringify({
    manifestVersion: 1,
    id: 'com.test.mymod',
    name: 'Test Mod',
    version: '1.0.0',
    author: 'TestAuthor',
    category: 'graphics',
    gameId: 'gtav',
    files: [
      { source: 'files/test.asi', destination: 'test.asi', action: 'add' },
    ],
  });

  describe('findAndParse', () => {
    it('should parse a valid manifest from archive', async () => {
      const zipPath = createZip({
        'mod.json': validManifest,
        'files/test.asi': 'binary-content',
      });
      const result = await reader.findAndParse(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fallback).toBe(false);
        expect(result.data.manifest).not.toBeNull();
        expect(result.data.manifest!.name).toBe('Test Mod');
        expect(result.data.manifest!.version).toBe('1.0.0');
      }
    });

    it('should return fallback=true when no mod.json exists', async () => {
      const zipPath = createZip({ 'test.asi': 'content' });
      const result = await reader.findAndParse(zipPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fallback).toBe(true);
        expect(result.data.manifest).toBeNull();
      }
    });

    it('should return error for invalid JSON in mod.json', async () => {
      const zipPath = createZip({ 'mod.json': 'not-json' });
      const result = await reader.findAndParse(zipPath);
      expect(result.success).toBe(false);
    });

    it('should return error for corrupt archive', async () => {
      const invalidPath = path.join(tmpDir, 'not-a-zip.zip');
      fs.writeFileSync(invalidPath, 'not-a-zip');
      const result = await reader.findAndParse(invalidPath);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSchema', () => {
    it('should accept a valid manifest', () => {
      const result = reader.validateSchema(JSON.parse(validManifest));
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject missing required fields', () => {
      const result = reader.validateSchema({ manifestVersion: 1 });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty name', () => {
      const result = reader.validateSchema({
        manifestVersion: 1,
        name: '',
        version: '1.0',
        author: 'Test',
        category: 'graphics',
        gameId: 'gtav',
        files: [{ source: 'a', destination: 'b', action: 'add' }],
      });
      expect(result.valid).toBe(false);
    });

    it('should reject empty files array', () => {
      const result = reader.validateSchema({
        manifestVersion: 1,
        name: 'Test',
        version: '1.0',
        author: 'Test',
        category: 'graphics',
        gameId: 'gtav',
        files: [],
      });
      expect(result.valid).toBe(false);
    });

    it('should warn on unknown category', () => {
      const result = reader.validateSchema({
        manifestVersion: 1,
        name: 'Test',
        version: '1.0',
        author: 'Test',
        category: 'unknown-category',
        gameId: 'gtav',
        files: [{ source: 'a', destination: 'b', action: 'add' }],
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn on unsupported manifestVersion', () => {
      const result = reader.validateSchema({
        manifestVersion: 99,
        name: 'Test',
        version: '1.0',
        author: 'Test',
        category: 'graphics',
        gameId: 'gtav',
        files: [{ source: 'a', destination: 'b', action: 'add' }],
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject files[].source missing', () => {
      const result = reader.validateSchema({
        manifestVersion: 1,
        name: 'Test',
        version: '1.0',
        author: 'Test',
        category: 'graphics',
        gameId: 'gtav',
        files: [{ destination: 'b', action: 'add' }],
      });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid file action', () => {
      const result = reader.validateSchema({
        manifestVersion: 1,
        name: 'Test',
        version: '1.0',
        author: 'Test',
        category: 'graphics',
        gameId: 'gtav',
        files: [{ source: 'a', destination: 'b', action: 'delete' }],
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('buildModArchive', () => {
    it('should build ModArchive from valid manifest', () => {
      const manifest = JSON.parse(validManifest);
      const archive = reader.buildModArchive(manifest, ['files/test.asi']);
      expect(archive.name).toBe('Test Mod');
      expect(archive.version).toBe('1.0.0');
      expect(archive.author).toBe('TestAuthor');
      expect(archive.files.length).toBe(1);
      expect(archive.files[0]!.relativePath).toBe('test.asi');
      expect(archive.category.id).toBe('graphics');
      expect(archive.category.name).toBe('Graphics');
    });

    it('should include only files that exist in the archive', () => {
      const manifest = JSON.parse(validManifest);
      const archive = reader.buildModArchive(manifest, []);
      expect(archive.files.length).toBe(0);
    });

    it('should handle missing category gracefully', () => {
      const manifest = JSON.parse(validManifest);
      manifest.category = 'unknown';
      const archive = reader.buildModArchive(manifest, ['files/test.asi']);
      expect(archive.category.id).toBe('unknown');
      expect(archive.category.name).toBe('unknown');
    });
  });

  describe('buildFlatModArchive', () => {
    it('should build archive from flat file list', () => {
      const files = ['file1.asi', 'scripts/file2.asi'];
      const archive = reader.buildFlatModArchive(files);
      expect(archive.name).toBe('Unknown Mod');
      expect(archive.files.length).toBe(2);
      expect(archive.files[0]!.relativePath).toBe('file1.asi');
      expect(archive.files[1]!.relativePath).toBe('scripts/file2.asi');
    });

    it('should handle empty file list', () => {
      const archive = reader.buildFlatModArchive([]);
      expect(archive.files.length).toBe(0);
    });
  });
});
