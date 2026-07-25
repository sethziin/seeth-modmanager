# Inter-Process Communication (IPC)

## Objective
To establish a robust, type-safe, and secure communication channel between the Electron main process (Node.js) and the renderer process (Chromium) for the Entropic State Mod Manager.

## Responsibility
- Expose a strongly-typed API to the frontend via `contextBridge`.
- Handle request-response operations securely using `ipcMain.handle`.
- Send push notifications and progress updates from the main process to the renderer using `ipcMain.on` and `webContents.send`.
- Ensure all communications are type-checked and error-handled consistently.

## Scope
This document covers the IPC architecture, channel naming conventions, push event channels, the preload script structure, type safety requirements, handler organization, and error handling for IPC within the Entropic State application.

## Dependencies
- Architecture Overview (Provider patterns and service backend definitions)
- [07-FILE_SYSTEM.md](07-FILE_SYSTEM.md) - For fs and config channel dependencies.
- [08-GAME_SYSTEM.md](08-GAME_SYSTEM.md) - For game and mod channel definitions.

## IPC Architecture
Electron IPC connects the main process (Node.js) and renderer process (Chromium). This project uses:
- `contextBridge` to expose a typed API object (`window.electronAPI`)
- `ipcMain.handle()` for request-response patterns
- `ipcMain.on()` + `webContents.send()` for push notifications (progress, events)

## Channel Naming Convention
Format: `domain:action` in kebab-case
Examples:
- `game:detect-all` - Detect all installed games
- `game:get-details` - Get details for specific game
- `mod:install` - Install a mod
- `mod:uninstall` - Uninstall a mod
- `mod:enable` - Enable a mod
- `mod:disable` - Disable a mod
- `mod:get-installed` - Get installed mods for a game
- `mod:check-updates` - Check for mod updates
- `download:start` - Start a download
- `download:cancel` - Cancel a download
- `download:get-queue` - Get download queue
- `config:get` - Get configuration
- `config:set` - Set configuration
- `config:reset` - Reset to defaults
- `log:get-entries` - Get log entries
- `log:clear` - Clear logs
- `fs:select-directory` - Open directory picker dialog
- `fs:get-disk-usage` - Get disk usage stats
- `app:get-version` - Get app version
- `window:minimize` - Minimize window
- `window:maximize` - Toggle maximize
- `window:close` - Close window

## Push Event Channels (main → renderer)
- `download:progress` - Download progress update
- `download:complete` - Download completed
- `download:error` - Download error
- `mod:install-progress` - Mod installation progress
- `mod:conflict-detected` - Mod conflict detected
- `game:status-changed` - Game status changed
- `app:notification` - General notification

## Preload Script Structure
The preload script (`src/preload/index.ts`) exposes `window.electronAPI`:
```typescript
interface ElectronAPI {
  // Games
  game: {
    detectAll(): Promise<DetectedGame[]>
    getDetails(gameId: string): Promise<GameDetails>
    setDirectory(gameId: string, path: string): Promise<void>
  }
  // Mods
  mod: {
    install(gameId: string, filePath: string): Promise<InstalledMod>
    uninstall(gameId: string, modId: string): Promise<void>
    enable(gameId: string, modId: string): Promise<void>
    disable(gameId: string, modId: string): Promise<void>
    getInstalled(gameId: string): Promise<InstalledMod[]>
    checkUpdates(gameId: string): Promise<ModUpdate[]>
  }
  // Downloads
  download: {
    start(url: string, metadata: DownloadMetadata): Promise<string>
    cancel(downloadId: string): Promise<void>
    getQueue(): Promise<DownloadItem[]>
    onProgress(callback: (progress: DownloadProgress) => void): () => void
    onComplete(callback: (result: DownloadResult) => void): () => void
    onError(callback: (error: DownloadError) => void): () => void
  }
  // Config
  config: {
    get<T>(key: string): Promise<T>
    set<T>(key: string, value: T): Promise<void>
    reset(): Promise<void>
  }
  // File System
  fs: {
    selectDirectory(title?: string): Promise<string | null>
    getDiskUsage(path: string): Promise<DiskUsage>
  }
  // Window
  window: {
    minimize(): void
    maximize(): void
    close(): void
  }
  // App
  app: {
    getVersion(): Promise<string>
  }
  // Logs
  log: {
    getEntries(filter?: LogFilter): Promise<LogEntry[]>
    clear(): Promise<void>
  }
}
```

## Type Safety
- All IPC channels must have corresponding TypeScript types in `src/shared/types/ipc.types.ts`
- Use a channel map type to enforce type safety:
```typescript
type IpcChannelMap = {
  'mod:install': { params: [string, string]; result: InstalledMod }
  'mod:uninstall': { params: [string, string]; result: void }
  // ... etc
}
```

## IPC Handler Organization
One file per domain in `src/main/ipc/`:
- `game.ipc.ts`
- `mod.ipc.ts`
- `download.ipc.ts`
- `config.ipc.ts`
- `fs.ipc.ts`
- `window.ipc.ts`
- `app.ipc.ts`
- `log.ipc.ts`

Each file exports a `registerXxxIpcHandlers(services)` function.

## Error Handling in IPC
- Wrap all handler bodies in try/catch
- Serialize errors to a standard format: `{ code: string, message: string, details?: unknown }`
- Never expose internal stack traces to renderer
- Log full error details in main process

## Criteria for Completion
- `window.electronAPI` is fully defined and typed.
- IPC handlers are organized into domain-specific files.
- Type safety maps are implemented and strictly enforced across main and renderer.
- Error handling standard is consistently applied.

## Next Steps
- Define `ipc.types.ts` and set up the `IpcChannelMap`.
- Implement `registerXxxIpcHandlers` for the initial domains (`game`, `app`, `window`).
- Finalize the error serialization format.

## Relation to Other Documents
- Connects directly with frontend (renderer) store integration and backend (main) services.
- Defines communication layer for [08-GAME_SYSTEM.md](08-GAME_SYSTEM.md) methods.
