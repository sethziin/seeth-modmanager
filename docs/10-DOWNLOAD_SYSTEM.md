# Download System Architecture

## Objective
To outline the download management capabilities of Entropic State, detailing how remote mod archives and updates are fetched, tracked, verified, and cached securely and efficiently.

## Responsibility
The Download System manages HTTP requests for large files, handling network interruptions, queueing, concurrency limits, and file integrity validation before handing off to the Mod System.

## Scope
- Download Service and Queue Management
- State and Progress Tracking
- IPC Communication for UI updates
- Checksum verification and Retries
- Cache management and cleanup

## Download Manager
The `DownloadService` manages all HTTP downloads with these capabilities:
- Queue management (max 3 concurrent downloads)
- Progress tracking with byte-level accuracy
- Pause/Resume support (HTTP Range headers)
- Retry on failure (3 attempts with exponential backoff)
- Checksum verification (SHA-256) after download
- Automatic file organization to cache directory

## Download Data Model
```typescript
interface DownloadItem {
  id: string                    // UUID v4
  url: string                   // Source URL
  fileName: string              // Target filename
  destinationPath: string       // Where to save
  status: DownloadStatus        // pending | downloading | paused | completed | failed
  progress: number              // 0-100
  bytesDownloaded: number       // Bytes received
  totalBytes: number            // Total expected bytes (from Content-Length)
  speed: number                 // Current download speed (bytes/sec)
  eta: number                   // Estimated time remaining (seconds)
  retryCount: number            // Current retry attempt
  error?: string                // Error message if failed
  createdAt: string             // ISO date
  completedAt?: string          // ISO date when completed
  checksum?: string             // Expected checksum
  metadata: DownloadMetadata    // Associated mod info
}

interface DownloadMetadata {
  modName: string
  modVersion: string
  gameId: string
  autoInstall: boolean          // Automatically install after download
}

type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'
```

## Progress Communication
- Main process sends progress updates to renderer via IPC push events
- Throttle progress updates to every 250ms to avoid flooding
- Include: `downloadId`, `bytesDownloaded`, `totalBytes`, `speed`, `eta`
- Zustand store in renderer receives and stores progress state

## Download Flow
1. Renderer requests download via `download:start` IPC
2. Main process creates `DownloadItem`, adds to queue
3. If queue has capacity, start download immediately
4. Send progress events at 250ms intervals
5. On completion: verify checksum, move to final destination
6. If `autoInstall`: trigger mod installation automatically
7. On failure: retry up to 3 times, then mark as failed
8. Send completion/error event to renderer

## Cache Management
- Downloaded archives stored in `%APPDATA%/entropic-state/cache/downloads/`
- Cache tracks file age and last access time
- Auto-cleanup: remove files older than 30 days and not referenced by installed mods
- Manual cleanup: user can clear cache from Settings
- Show total cache size in Settings

## Dependencies
- `09-MOD_SYSTEM.md` (for auto-install behavior)
- `15-CONFIGURATION.md` (for download concurrency and cache settings)

## Criteria for Completion
- Implementation of `DownloadService` with robust queueing.
- UI implementation for the Downloads page showing accurate progress and ETA.
- Working pause, resume, and cancel operations.
- Successful implementation of IPC throttling to prevent UI lockups.
- Cache cleanup cron/task functional.

## Next Steps
- Write HTTP streaming wrapper with pause/resume support.
- Implement the Zustand store for managing UI state.
- Create Downloads view with progress bars.

## Relation to Other Documents
The Download System feeds directly into the Mod System when `autoInstall` is flagged. It relies on the Configuration System to determine concurrency limits, retry delays, and cache retention policies.
