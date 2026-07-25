import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { LogService } from '../services/log-service';
import type { CatalogData } from '../services/catalog-service';

const REMOTE_URL = 'https://raw.githubusercontent.com/sethziin/seeth-modmanager-catalog/main/catalog.json';

export class RemoteCatalogProvider {
  private readonly log: LogService;
  private readonly cacheFilePath: string;
  private lastEtag: string | null = null;
  private lastSyncTime: number | null = null;
  private syncAttempts = 0;

  constructor(log: LogService, cacheDir: string) {
    this.log = log;
    this.cacheFilePath = path.join(cacheDir, 'catalog.json');
  }

  async sync(): Promise<Result<boolean>> {
    try {
      const headers: Record<string, string> = {};
      if (this.lastEtag) {
        headers['If-None-Match'] = this.lastEtag;
      }

      const response = await fetch(REMOTE_URL, { headers, signal: AbortSignal.timeout(10000) });

      if (response.status === 304) {
        this.lastSyncTime = Date.now();
        this.syncAttempts = 0;
        return ok(false);
      }

      if (!response.ok) {
        this.syncAttempts++;
        this.log.warn('RemoteCatalogProvider', `HTTP ${response.status} fetching catalog`);
        return ok(false);
      }

      const raw = await response.text();
      const etag = response.headers.get('etag');

      let parsed: CatalogData;
      try {
        parsed = JSON.parse(raw) as CatalogData;
      } catch {
        this.syncAttempts++;
        this.log.warn('RemoteCatalogProvider', 'Invalid JSON in remote catalog');
        return ok(false);
      }

      if (!parsed.entries || !Array.isArray(parsed.entries)) {
        this.syncAttempts++;
        this.log.warn('RemoteCatalogProvider', 'Remote catalog missing entries array');
        return ok(false);
      }

      if (parsed.checksum) {
        const localRaw = this.readCacheFile();
        if (localRaw) {
          try {
            const localParsed = JSON.parse(localRaw) as CatalogData;
            if (localParsed.checksum === parsed.checksum) {
              this.lastSyncTime = Date.now();
              this.syncAttempts = 0;
              return ok(false);
            }
          } catch {
            // Proceed to write
          }
        }
      }

      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${this.cacheFilePath}.tmp`;
      fs.writeFileSync(tempPath, raw, 'utf-8');
      fs.renameSync(tempPath, this.cacheFilePath);

      if (etag) {
        this.lastEtag = etag;
      }
      this.lastSyncTime = Date.now();
      this.syncAttempts = 0;

      this.log.info('RemoteCatalogProvider', 'Catalog synced successfully', {
        entries: parsed.entries.length,
        etag,
      });

      return ok(true);
    } catch (error) {
      this.syncAttempts++;

      if (error instanceof Error && error.name === 'TimeoutError') {
        this.log.warn('RemoteCatalogProvider', 'Catalog fetch timed out');
      } else {
        this.log.warn('RemoteCatalogProvider', 'Catalog sync failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return ok(false);
    }
  }

  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  getSyncAttempts(): number {
    return this.syncAttempts;
  }

  private readCacheFile(): string | null {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        return fs.readFileSync(this.cacheFilePath, 'utf-8');
      }
    } catch {
      // Best-effort
    }
    return null;
  }
}
