import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { DownloadItem, DownloadMetadata, DownloadProgress, DownloadResult } from '../../shared/types/download';
import type { LogService } from './log-service';
import type { FileSystemService } from './filesystem-service';
import type { CacheService } from './cache-service';
import type { ConfigService } from './config-service';

const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;

type ProgressCallback = (progress: DownloadProgress) => void;
type CompleteCallback = (result: DownloadResult) => void;
type ErrorCallback = (downloadId: string, error: string) => void;

export class DownloadService {
  private readonly queue: DownloadItem[] = [];
  private readonly activeDownloads = new Map<string, AbortController>();
  private readonly log: LogService;
  private readonly fileSystem: FileSystemService;
  private readonly cache: CacheService;
  private readonly config: ConfigService;

  private onProgress: ProgressCallback | null = null;
  private onComplete: CompleteCallback | null = null;
  private onError: ErrorCallback | null = null;

  constructor(
    log: LogService,
    fileSystem: FileSystemService,
    cache: CacheService,
    config: ConfigService,
  ) {
    this.log = log;
    this.fileSystem = fileSystem;
    this.cache = cache;
    this.config = config;
  }

  setCallbacks(
    onProgress: ProgressCallback,
    onComplete: CompleteCallback,
    onError: ErrorCallback,
  ): void {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  async startDownload(url: string, metadata: DownloadMetadata): Promise<Result<string>> {
    const downloadId = randomUUID();
    const fileName = this.extractFileName(url);
    const destinationPath = path.join(this.cache.getDownloadPath(), fileName);

    const configResult = this.config.getConfig();
    const maxConcurrent = configResult.success
      ? configResult.data.downloads.maxConcurrent
      : MAX_CONCURRENT;

    if (this.getActiveCount() >= maxConcurrent) {
      return err(
        createError('DOWNLOAD_FAILED', 'Download queue is full', {
          recoverable: true,
          suggestion: 'Wait for an active download to complete',
        }),
      );
    }

    const item: DownloadItem = {
      id: downloadId,
      url,
      fileName,
      destinationPath,
      status: 'pending',
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      speed: 0,
      eta: 0,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      metadata,
    };

    this.queue.push(item);
    this.processQueue();

    return ok(downloadId);
  }

  async cancelDownload(downloadId: string): Promise<Result<void>> {
    const controller = this.activeDownloads.get(downloadId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(downloadId);
    }

    const index = this.queue.findIndex((d) => d.id === downloadId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    return ok(undefined);
  }

  getQueue(): readonly DownloadItem[] {
    return [...this.queue];
  }

  getActiveDownloads(): readonly DownloadItem[] {
    return this.queue.filter((d) => d.status === 'downloading');
  }

  getActiveCount(): number {
    return this.queue.filter((d) => d.status === 'downloading').length;
  }

  private processQueue(): void {
    const configResult = this.config.getConfig();
    const maxConcurrent = configResult.success
      ? configResult.data.downloads.maxConcurrent
      : MAX_CONCURRENT;

    const pending = this.queue.filter((d) => d.status === 'pending');
    const availableSlots = maxConcurrent - this.getActiveCount();

    for (let i = 0; i < Math.min(availableSlots, pending.length); i++) {
      const item = pending[i];
      if (item) {
        this.executeDownload(item);
      }
    }
  }

  private async executeDownload(item: DownloadItem): Promise<void> {
    const controller = new AbortController();
    this.activeDownloads.set(item.id, controller);

    this.updateItem(item.id, { status: 'downloading' });

    try {
      const configResult = this.config.getConfig();
      const maxRetries = configResult.success
        ? configResult.data.downloads.maxRetries
        : MAX_RETRIES;

      let lastError: string | undefined;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await this.performDownload(item, controller.signal);
          if (result.success) {
            const checksumResult = this.fileSystem.calculateFileHash(item.destinationPath);
            const actualChecksum = checksumResult.success ? `sha256:${checksumResult.data}` : '';

            this.updateItem(item.id, {
              status: 'completed',
              progress: 100,
              checksum: actualChecksum,
              completedAt: new Date().toISOString(),
            });
            this.onComplete?.({
              downloadId: item.id,
              filePath: item.destinationPath,
              checksum: actualChecksum,
              metadata: item.metadata,
            });
            this.log.info('DownloadService', 'Download completed', {
              downloadId: item.id,
              fileName: item.fileName,
            });
            this.activeDownloads.delete(item.id);
            this.processQueue();
            return;
          }
          lastError = result.error.message;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }

        if (attempt < maxRetries) {
          this.log.warn('DownloadService', 'Download retry', {
            downloadId: item.id,
            attempt: attempt + 1,
          });
          this.updateItem(item.id, { retryCount: attempt + 1 });
          await this.delay(1000 * (attempt + 1));
        }
      }

      this.updateItem(item.id, { status: 'failed', error: lastError });
      this.onError?.(item.id, lastError ?? 'Download failed');
      this.log.error('DownloadService', 'Download failed', undefined, {
        downloadId: item.id,
        error: lastError,
      });
    } finally {
      this.activeDownloads.delete(item.id);
      this.processQueue();
    }
  }

  private async performDownload(
    item: DownloadItem,
    signal: AbortSignal,
  ): Promise<Result<void>> {
    try {
      const response = await fetch(item.url, { signal });

      if (!response.ok) {
        return err(
          createError('DOWNLOAD_FAILED', `HTTP ${response.status}`, {
            recoverable: true,
          }),
        );
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      this.updateItem(item.id, { totalBytes });

      if (!response.body) {
        return err(
          createError('DOWNLOAD_FAILED', 'No response body', {
            recoverable: false,
          }),
        );
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytesDownloaded = 0;
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        bytesDownloaded += value.length;

        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? bytesDownloaded / elapsed : 0;
        const eta = speed > 0 ? (totalBytes - bytesDownloaded) / speed : 0;
        const progress = totalBytes > 0 ? (bytesDownloaded / totalBytes) * 100 : 0;

        this.updateItem(item.id, { bytesDownloaded, totalBytes, speed, eta, progress });
        this.onProgress?.({
          downloadId: item.id,
          bytesDownloaded,
          totalBytes,
          speed,
          eta,
        });
      }

      const data = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }

      const dir = path.dirname(item.destinationPath);
      this.fileSystem.ensureDir(dir);
      fs.writeFileSync(item.destinationPath, data);

      return ok(undefined);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return err(
          createError('DOWNLOAD_FAILED', 'Download cancelled', {
            recoverable: true,
          }),
        );
      }
      throw error;
    }
  }

  private updateItem(downloadId: string, updates: Partial<DownloadItem>): void {
    const index = this.queue.findIndex((d) => d.id === downloadId);
    if (index !== -1) {
      const item = this.queue[index];
      if (item) {
        this.queue[index] = { ...item, ...updates } as DownloadItem;
      }
    }
  }

  private extractFileName(url: string): string {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart || `download-${Date.now()}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
