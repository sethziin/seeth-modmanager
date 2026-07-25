# 13 - State Management Strategy

## Objective
To define the state management architecture and conventions for the Entropic State Mod Manager application using Zustand, ensuring scalable, predictable, and performant state updates across different feature domains.

## Responsibility
This document governs the design and implementation of all client-side state stores, their actions, error handling, IPC event listeners integration, and state persistence patterns. It acts as the reference for adding new stores or modifying existing ones.

## Scope
- Store architecture and domain separation (Game, Mod, Download, Config, Notification, UI)
- Interface definitions for state and actions
- Implementation patterns using Zustand and optional immer middleware
- Integration with Electron IPC for event-driven updates
- Rules for state persistence vs. session state

## Dependencies
- `01-ARCHITECTURE.md`: Overall application architecture and provider patterns.
- `14-THEMING.md`: UI store relates to some theming/UI layout state.

## State Management with Zustand
The project uses Zustand for state management. Each feature domain has its own store to maintain separation of concerns and avoid monolithic state objects.

## Store Architecture

### gameStore (game.store.ts)
```typescript
interface GameState {
  games: DetectedGame[]
  selectedGameId: string | null
  selectedGame: GameDetails | null
  loading: boolean
  error: string | null
}

interface GameActions {
  detectGames(): Promise<void>
  selectGame(gameId: string): Promise<void>
  setGameDirectory(gameId: string, path: string): Promise<void>
  refreshGameDetails(gameId: string): Promise<void>
}
```

### modStore (mod.store.ts)
```typescript
interface ModState {
  installedMods: InstalledMod[]
  filteredMods: InstalledMod[]
  selectedCategory: string | null
  searchQuery: string
  sortBy: 'name' | 'date' | 'category'
  viewMode: 'grid' | 'list'
  loading: boolean
  error: string | null
  installProgress: number | null
}

interface ModActions {
  fetchInstalledMods(gameId: string): Promise<void>
  installMod(gameId: string, filePath: string): Promise<void>
  uninstallMod(gameId: string, modId: string): Promise<void>
  enableMod(gameId: string, modId: string): Promise<void>
  disableMod(gameId: string, modId: string): Promise<void>
  setCategory(category: string | null): void
  setSearch(query: string): void
  setSortBy(sort: 'name' | 'date' | 'category'): void
  setViewMode(mode: 'grid' | 'list'): void
  checkUpdates(gameId: string): Promise<void>
}
```

### downloadStore (download.store.ts)
```typescript
interface DownloadState {
  queue: DownloadItem[]
  activeDownloads: DownloadItem[]
  completedDownloads: DownloadItem[]
  loading: boolean
  error: string | null
}

interface DownloadActions {
  startDownload(url: string, metadata: DownloadMetadata): Promise<void>
  cancelDownload(downloadId: string): Promise<void>
  retryDownload(downloadId: string): Promise<void>
  clearCompleted(): void
  fetchQueue(): Promise<void>
  // These are called by IPC listeners:
  updateProgress(downloadId: string, progress: DownloadProgress): void
  markCompleted(downloadId: string): void
  markFailed(downloadId: string, error: string): void
}
```

### configStore (config.store.ts)
```typescript
interface ConfigState {
  config: AppConfig | null
  loading: boolean
  error: string | null
}

interface ConfigActions {
  loadConfig(): Promise<void>
  updateConfig(key: string, value: unknown): Promise<void>
  resetConfig(): Promise<void>
}
```

### notificationStore (notification.store.ts)
```typescript
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  dismissible: boolean
}

interface NotificationState {
  notifications: Notification[]
}

interface NotificationActions {
  addNotification(notification: Omit<Notification, 'id'>): void
  removeNotification(id: string): void
  clearAll(): void
}
```

### uiStore (ui.store.ts)
```typescript
interface UiState {
  sideNavCollapsed: boolean
  currentRoute: string
  modalOpen: string | null
  searchGlobal: string
}

interface UiActions {
  toggleSideNav(): void
  setCurrentRoute(route: string): void
  openModal(modalId: string): void
  closeModal(): void
  setGlobalSearch(query: string): void
}
```

## Store Patterns
- Each store file exports a `use[Domain]Store` hook created with `create<State & Actions>()`
- Use `immer` middleware for complex state updates if needed
- Async actions call `electronAPI` and update state based on results
- Error handling: catch errors, set error state, show notification
- Loading states: set loading before async operation, clear after

## IPC Event Listeners
Set up IPC event listeners in store initialization to react to main process events:
```typescript
// In download.store.ts
const useDownloadStore = create<DownloadState & DownloadActions>((set) => {
  // Set up listeners
  window.electronAPI.download.onProgress((progress) => {
    set((state) => ({ ... }))
  })
  
  return {
    // ... initial state and actions
  }
})
```

## State Persistence
- UI state (view mode, sort preferences) is persisted to config.
- Game/mod data is fetched fresh from the main process on app start.
- Download queue is restored from the main process on app start.
- No `localStorage` usage; all persistence routes through the ConfigService.

## Criteria for Completion
- Store schemas correctly reflect the provided interface definitions.
- All IPC event bindings are incorporated into their respective stores.
- Actions implement proper error handling and loading toggles.

## Next Steps
- Implement store files using Zustand in `src/renderer/stores/`.
- Wire stores into the React components ensuring selectors are optimized.

## Relation to Other Documents
- Serves as the implementation guide following the data flow defined in Architecture.
- Used by components built according to `14-THEMING.md` guidelines.
