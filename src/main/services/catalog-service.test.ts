import { describe, it, expect } from 'vitest';
import { CatalogService, LocalCatalogProvider } from './catalog-service';
import { LogService } from './log-service';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('LocalCatalogProvider', () => {
  it('should return fallback entries when no catalog file exists', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();
    const result = provider.search('');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should search by name', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();
    const result = provider.search('NaturalVision');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]!.name).toContain('NaturalVision');
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should search by author', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();
    const result = provider.search('Razed');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]!.author).toContain('Razed');
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should filter by category', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();
    const result = provider.search('', { category: 'graphics' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.every((e) => e.category === 'graphics')).toBe(true);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should sort by rating descending', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();
    const result = provider.search('', { sortBy: 'rating', sortOrder: 'desc' });

    expect(result.success).toBe(true);
    if (result.success && result.data.length > 1) {
      expect(result.data[0]!.rating).toBeGreaterThanOrEqual(result.data[result.data.length - 1]!.rating ?? 0);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should get entry by id', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();
    const result = provider.getEntry('com.razed.naturalvision');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('NaturalVision Evolved');
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return error for unknown entry', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();
    const result = provider.getEntry('nonexistent.id');

    expect(result.success).toBe(false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should write catalog to disk on first access', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const provider = new LocalCatalogProvider(log, tmpDir);

    await provider.refresh();

    const catalogFile = path.join(tmpDir, 'catalog.json');
    expect(fs.existsSync(catalogFile)).toBe(true);

    const raw = fs.readFileSync(catalogFile, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(1);
    expect(parsed.entries.length).toBeGreaterThan(0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('CatalogService', () => {
  it('should aggregate results from multiple providers', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-test-'));
    const log = new LogService(path.join(tmpDir, 'logs'));
    const catalog = new CatalogService();
    const provider = new LocalCatalogProvider(log, tmpDir);

    catalog.registerProvider(provider);
    await catalog.refreshAll();

    const result = catalog.search('');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
