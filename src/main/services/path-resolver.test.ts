import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { PathResolver } from './path-resolver';

describe('PathResolver', () => {
  const testDir = 'C:\\test\\entropic-state';
  const resolver = new PathResolver(testDir);

  it('should return the data directory', () => {
    expect(resolver.getDataDir()).toBe(testDir);
  });

  it('should resolve config file path', () => {
    expect(resolver.configFile()).toBe(path.join(testDir, 'config.json'));
  });

  it('should resolve game registry file path', () => {
    expect(resolver.gameRegistryFile()).toBe(path.join(testDir, 'games.json'));
  });

  it('should resolve mod registry file path for a game', () => {
    expect(resolver.modRegistryFile('gtav')).toBe(path.join(testDir, 'games', 'gtav', 'mods.json'));
  });

  it('should resolve mod registry directory for a game', () => {
    expect(resolver.modRegistryDir('gtav')).toBe(path.join(testDir, 'games', 'gtav'));
  });

  it('should resolve disabled directory for a mod', () => {
    const result = resolver.disabledDir('gtav', 'mod-123');
    expect(result).toBe(path.join(testDir, 'games', 'gtav', 'disabled', 'mod-123'));
  });

  it('should resolve disabled manifest file', () => {
    const result = resolver.disabledManifestFile('gtav', 'mod-123');
    expect(result).toBe(path.join(testDir, 'games', 'gtav', 'disabled', 'mod-123', 'manifest.json'));
  });

  it('should resolve backups directory', () => {
    expect(resolver.backupsDir()).toBe(path.join(testDir, 'backups'));
  });

  it('should resolve game backups directory', () => {
    expect(resolver.gameBackupsDir('gtav')).toBe(path.join(testDir, 'backups', 'gtav'));
  });

  it('should resolve backup directory for a timestamp', () => {
    expect(resolver.backupDir('gtav', '2026-07-24T10-30-00Z')).toBe(
      path.join(testDir, 'backups', 'gtav', '2026-07-24T10-30-00Z'),
    );
  });

  it('should resolve backup manifest file', () => {
    expect(resolver.backupManifestFile('gtav', '2026-07-24T10-30-00Z')).toBe(
      path.join(testDir, 'backups', 'gtav', '2026-07-24T10-30-00Z', 'manifest.json'),
    );
  });

  it('should resolve cache directory', () => {
    expect(resolver.cacheDir()).toBe(path.join(testDir, 'cache'));
  });

  it('should resolve downloads directory', () => {
    expect(resolver.downloadsDir()).toBe(path.join(testDir, 'cache', 'downloads'));
  });

  it('should resolve download directory for an id', () => {
    expect(resolver.downloadDir('dl-001')).toBe(path.join(testDir, 'cache', 'downloads', 'dl-001'));
  });

  it('should resolve catalogs directory', () => {
    expect(resolver.catalogsDir()).toBe(path.join(testDir, 'cache', 'catalogs'));
  });

  it('should resolve local catalog file', () => {
    expect(resolver.localCatalogFile()).toBe(
      path.join(testDir, 'cache', 'catalogs', 'local', 'catalog.json'),
    );
  });

  it('should resolve temp directory', () => {
    expect(resolver.tempDir()).toBe(path.join(testDir, 'temp'));
  });

  it('should resolve staging directory for a mod', () => {
    expect(resolver.stagingDir('mod-123')).toBe(path.join(testDir, 'temp', 'staging', 'mod-123'));
  });

  it('should resolve logs directory', () => {
    expect(resolver.logsDir()).toBe(path.join(testDir, 'logs'));
  });

  it('should resolve dependencies file', () => {
    expect(resolver.dependenciesFile()).toBe(path.join(testDir, 'dependencies.json'));
  });

  it('should return required directories', () => {
    const dirs = resolver.getRequiredDirectories();
    expect(dirs).toContain(testDir);
    expect(dirs).toContain(path.join(testDir, 'games'));
    expect(dirs).toContain(path.join(testDir, 'cache'));
    expect(dirs).toContain(path.join(testDir, 'cache', 'downloads'));
    expect(dirs).toContain(path.join(testDir, 'cache', 'catalogs'));
    expect(dirs).toContain(path.join(testDir, 'temp'));
    expect(dirs).toContain(path.join(testDir, 'logs'));
  });
});
