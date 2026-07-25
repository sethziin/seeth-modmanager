import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { LogService } from '../services/log-service';
import { RemoteCatalogProvider } from './remote-catalog.provider';

const VALID_CATALOG_JSON = JSON.stringify({
  version: 1,
  updatedAt: '2026-07-25T00:00:00Z',
  source: 'github',
  checksum: 'abc123',
  entries: [
    { id: 'test.mod', name: 'Test Mod', version: '1.0', author: 'Tester', category: 'scripts', tags: [], sourceUrl: '', dependencies: [], gameId: 'gtav', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-25T00:00:00Z' },
  ],
});

function mockFetch(status: number, body: string, etag?: string) {
  const headers = new Map<string, string>();
  if (etag) headers.set('etag', etag);
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
    headers: { get: (name: string) => headers.get(name) ?? null },
  });
}

describe('RemoteCatalogProvider', () => {
  let tmpDir: string;
  let log: LogService;
  let provider: RemoteCatalogProvider;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-catalog-test-'));
    log = new LogService(path.join(tmpDir, 'logs'));
    provider = new RemoteCatalogProvider(log, tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('sync', () => {
    it('should fetch and cache catalog on 200 OK', async () => {
      vi.stubGlobal('fetch', mockFetch(200, VALID_CATALOG_JSON, '"etag-123"'));

      const result = await provider.sync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }

      const cachePath = path.join(tmpDir, 'catalog.json');
      expect(fs.existsSync(cachePath)).toBe(true);
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      expect(cached.entries[0].name).toBe('Test Mod');
    });

    it('should return false on 304 Not Modified', async () => {
      await provider.sync();
      const cachePath = path.join(tmpDir, 'catalog.json');
      fs.writeFileSync(cachePath, VALID_CATALOG_JSON);

      vi.stubGlobal('fetch', mockFetch(304, ''));

      const result = await provider.sync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should skip cache write when checksum matches existing', async () => {
      fs.writeFileSync(path.join(tmpDir, 'catalog.json'), VALID_CATALOG_JSON);
      const mtimeBefore = fs.statSync(path.join(tmpDir, 'catalog.json')).mtimeMs;

      vi.stubGlobal('fetch', mockFetch(200, VALID_CATALOG_JSON, '"etag-456"'));

      const result = await provider.sync();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }

      const mtimeAfter = fs.statSync(path.join(tmpDir, 'catalog.json')).mtimeMs;
      expect(mtimeAfter).toBe(mtimeBefore);
    });

    it('should handle network errors gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      const result = await provider.sync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should handle HTTP 500 errors gracefully', async () => {
      vi.stubGlobal('fetch', mockFetch(500, 'Internal Server Error'));

      const result = await provider.sync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should reject invalid JSON from remote', async () => {
      vi.stubGlobal('fetch', mockFetch(200, 'not-valid-json'));

      const result = await provider.sync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should reject catalog without entries array', async () => {
      vi.stubGlobal('fetch', mockFetch(200, JSON.stringify({ version: 1 })));

      const result = await provider.sync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should write catalog atomically (temp + rename)', async () => {
      vi.stubGlobal('fetch', mockFetch(200, VALID_CATALOG_JSON, '"etag-789"'));

      await provider.sync();

      const cachePath = path.join(tmpDir, 'catalog.json');
      expect(fs.existsSync(cachePath)).toBe(true);
      expect(fs.existsSync(`${cachePath}.tmp`)).toBe(false);
    });

    it('should send ETag on subsequent requests', async () => {
      const fetchMock = mockFetch(200, VALID_CATALOG_JSON, '"etag-abc"');
      vi.stubGlobal('fetch', fetchMock);

      await provider.sync();

      const secondFetch = mockFetch(304, '');
      vi.stubGlobal('fetch', secondFetch);

      await provider.sync();

      const callArgs = secondFetch.mock.calls[0]?.[1] as Record<string, unknown> | undefined;
      expect(callArgs?.headers).toBeDefined();
    });

    it('should increment sync attempts on failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

      expect(provider.getSyncAttempts()).toBe(0);
      await provider.sync();
      expect(provider.getSyncAttempts()).toBe(1);
      await provider.sync();
      expect(provider.getSyncAttempts()).toBe(2);
    });

    it('should reset sync attempts on success', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));
      await provider.sync();
      expect(provider.getSyncAttempts()).toBe(1);

      vi.stubGlobal('fetch', mockFetch(200, VALID_CATALOG_JSON));
      await provider.sync();
      expect(provider.getSyncAttempts()).toBe(0);
    });
  });

  describe('getLastSyncTime', () => {
    it('should return null before first sync', () => {
      expect(provider.getLastSyncTime()).toBeNull();
    });

    it('should return timestamp after successful sync', async () => {
      vi.stubGlobal('fetch', mockFetch(200, VALID_CATALOG_JSON));
      await provider.sync();
      expect(provider.getLastSyncTime()).not.toBeNull();
    });
  });
});
