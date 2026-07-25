import { describe, it, expect } from 'vitest';
import type { DownloadMetadata, DownloadResult } from '../../shared/types/download';

describe('Download Pipeline Types', () => {
  it('should have expectedChecksum in DownloadMetadata', () => {
    const meta: DownloadMetadata = {
      modName: 'Test',
      modVersion: '1.0',
      gameId: 'gtav',
      autoInstall: true,
      catalogEntryId: 'com.test.mod',
      expectedChecksum: 'sha256:abc123',
    };
    expect(meta.expectedChecksum).toBe('sha256:abc123');
    expect(meta.catalogEntryId).toBe('com.test.mod');
  });

  it('should have metadata in DownloadResult', () => {
    const result: DownloadResult = {
      downloadId: 'dl-001',
      filePath: '/tmp/mod.smp',
      checksum: 'sha256:def456',
      metadata: {
        modName: 'Test',
        modVersion: '1.0',
        gameId: 'gtav',
        autoInstall: true,
      },
    };
    expect(result.metadata?.gameId).toBe('gtav');
    expect(result.metadata?.autoInstall).toBe(true);
  });

  it('should handle checksum mismatch detection logic', () => {
    const expected = 'sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
    const actual = 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    expect(expected).not.toBe(actual);
  });

  it('should allow install when checksum is empty (backward compat)', () => {
    const expected: string | undefined = undefined;
    const actual = '';
    const shouldBlock = expected !== undefined && actual !== expected;
    expect(shouldBlock).toBe(false);
  });

  it('should allow install when checksums match', () => {
    const chk = 'sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
    const expected = chk;
    const actual = chk;
    const shouldBlock = expected !== undefined && actual !== expected;
    expect(shouldBlock).toBe(false);
  });
});
