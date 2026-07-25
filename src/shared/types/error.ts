export type ErrorCode =
  | 'GAME_NOT_FOUND'
  | 'GAME_INVALID_PATH'
  | 'GAME_DETECTION_FAILED'
  | 'MOD_INSTALL_FAILED'
  | 'MOD_UNINSTALL_FAILED'
  | 'MOD_CONFLICT'
  | 'MOD_INVALID_ARCHIVE'
  | 'MOD_NOT_FOUND'
  | 'DOWNLOAD_FAILED'
  | 'DOWNLOAD_TIMEOUT'
  | 'DOWNLOAD_CHECKSUM_MISMATCH'
  | 'CONFIG_READ_FAILED'
  | 'CONFIG_WRITE_FAILED'
  | 'CONFIG_VALIDATION_FAILED'
  | 'FS_PERMISSION_DENIED'
  | 'FS_FILE_NOT_FOUND'
  | 'FS_DISK_FULL'
  | 'FS_DIRECTORY_NOT_FOUND'
  | 'BACKUP_FAILED'
  | 'BACKUP_RESTORATION_FAILED'
  | 'CACHE_CLEANUP_FAILED'
  | 'ARCHIVE_NOT_FOUND'
  | 'ARCHIVE_INVALID'
  | 'ARCHIVE_READ_FAILED'
  | 'ARCHIVE_CORRUPT'
  | 'EXTRACTION_FAILED'
  | 'PATH_TRAVERSAL_DETECTED'
  | 'FILE_NOT_FOUND'
  | 'FILE_READ_FAILED'
  | 'MANIFEST_READ_FAILED'
  | 'UNKNOWN_ERROR';

export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly recoverable: boolean;
  readonly suggestion?: string;
}

export function createError(
  code: ErrorCode,
  message: string,
  options?: {
    readonly details?: unknown;
    readonly recoverable?: boolean;
    readonly suggestion?: string;
  },
): AppError {
  return {
    code,
    message,
    details: options?.details,
    recoverable: options?.recoverable ?? false,
    suggestion: options?.suggestion,
  };
}
