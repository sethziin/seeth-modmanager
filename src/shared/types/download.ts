export type DownloadStatus =
  | 'pending'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface DownloadItem {
  readonly id: string;
  readonly url: string;
  readonly fileName: string;
  readonly destinationPath: string;
  readonly status: DownloadStatus;
  readonly progress: number;
  readonly bytesDownloaded: number;
  readonly totalBytes: number;
  readonly speed: number;
  readonly eta: number;
  readonly retryCount: number;
  readonly error?: string;
  readonly createdAt: string;
  readonly completedAt?: string;
  readonly checksum?: string;
  readonly metadata: DownloadMetadata;
}

export interface DownloadMetadata {
  readonly modName: string;
  readonly modVersion: string;
  readonly gameId: string;
  readonly autoInstall: boolean;
  readonly catalogEntryId?: string;
  readonly expectedChecksum?: string;
}

export interface DownloadProgress {
  readonly downloadId: string;
  readonly bytesDownloaded: number;
  readonly totalBytes: number;
  readonly speed: number;
  readonly eta: number;
}

export interface DownloadResult {
  readonly downloadId: string;
  readonly filePath: string;
  readonly checksum: string;
  readonly metadata?: DownloadMetadata;
}
