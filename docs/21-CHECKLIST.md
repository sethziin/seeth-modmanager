# 21-CHECKLIST.md

## Objective
Provide a comprehensive verification checklist for each development phase to ensure systematic progress and completion of requirements.

## Responsibility
Track development progress and act as a strict verification gate before moving to the next phase.

## Scope
Covers all development phases from initial project setup (Phase 0) to the first production release (Phase 9).

## Dependencies
- 02-STACK.md
- 18-ROADMAP.md
- 19-CURRENT_TASK.md
- 20-DECISIONS.md

## Criteria for Completion
All checkboxes for a given phase must be ticked and verified working before development can proceed to the next phase.

## Next Steps
Agents use this document to track what is done. After a phase is complete, update `19-CURRENT_TASK.md` and proceed to the next phase.

## Relation to Other Documents
Serves as the implementation verification tool for the Roadmap (`18-ROADMAP.md`) and is tightly coupled with `19-CURRENT_TASK.md`.

---

## Implementation Checklist

This is a comprehensive verification checklist for each development phase.

### Phase 0: Project Setup
- [x] Electron Forge project initialized with Vite template
- [x] All npm dependencies installed (see 02-STACK.md)
- [x] TypeScript configured with strict mode (tsconfig.json)
- [x] ESLint configured with TypeScript rules
- [x] Prettier configured
- [x] Vitest configured
- [x] Folder structure created (src/main, src/preload, src/renderer, src/shared)
- [x] Dev server runs successfully
- [x] Window opens with background color #131315
- [x] Window is frameless
- [x] Minimum size set to 1024x600
- [x] CURRENT_TASK.md updated

### Phase 1: Core Backend Services
- [x] LogService implemented and tested
- [x] ConfigService implemented with zod schemas and tested
- [x] FileSystemService implemented and tested
- [x] CacheService implemented and tested
- [x] GameProvider interface defined in src/shared/types
- [x] GTAVProvider implemented (detection, validation, install, uninstall)
- [x] GameService implemented (provider registry) and tested
- [x] BackupService implemented and tested
- [x] ModService implemented (install, uninstall, enable, disable, list) and tested
- [x] DownloadService implemented (queue, progress, retry, checksum) and tested
- [x] All services use Result<T, AppError> pattern
- [x] All services use dependency injection via constructor
- [x] All service tests pass
- [x] CURRENT_TASK.md updated
- [x] DECISIONS.md updated with any new decisions

### Phase 2: IPC Layer
- [x] All IPC channel types defined in src/shared/types/ipc.types.ts
- [x] Preload script implements typed electronAPI
- [x] game.ipc.ts handlers implemented
- [x] mod.ipc.ts handlers implemented
- [x] download.ipc.ts handlers implemented
- [x] config.ipc.ts handlers implemented
- [x] fs.ipc.ts handlers implemented
- [x] window.ipc.ts handlers implemented
- [x] app.ipc.ts handlers implemented
- [x] log.ipc.ts handlers implemented
- [x] Error handling wraps all handlers
- [ ] IPC round-trip tested from DevTools console
- [x] Push events working (download progress)
- [x] CURRENT_TASK.md updated

### Phase 3: Shared Types & Schemas
- [x] Game types complete (DetectedGame, GameDetails, GameInstallation, etc.)
- [x] Mod types complete (InstalledMod, ModFile, ModCategory, etc.)
- [x] Download types complete (DownloadItem, DownloadProgress, etc.)
- [x] Config types complete (AppConfig, GameConfig)
- [x] IPC channel type map complete
- [x] All JSON file schemas defined with zod
- [x] Types exported from src/shared/types/index.ts
- [x] CURRENT_TASK.md updated

### Phase 4: Design System & Layout Shell
- [x] variables.css created with all design tokens
- [x] reset.css created
- [x] typography.css created
- [x] scrollbar.css created
- [x] animations.css created
- [x] Geist font loaded (Google Fonts)
- [x] Material Symbols Outlined loaded
- [x] TitleBar component implemented (drag region, brand, window controls)
- [x] SideNav component implemented (items, active states, version, detected games)
- [x] StatusBar component implemented (status, sync, version)
- [x] Layout shell implemented (TitleBar + SideNav + Outlet + StatusBar)
- [x] HashRouter configured
- [x] All route placeholders created
- [x] Navigation works between all pages
- [x] Active state syncs with current route
- [x] Window controls work (minimize, maximize, close)
- [x] CURRENT_TASK.md updated

### Phase 5: Shared UI Components
- [x] Button component (4 variants: primary, secondary, ghost, danger; 3 sizes)
- [x] Card component (header/body/footer)
- [x] Input component (label, icon, error state)
- [x] Toggle component (accessible, animated)
- [x] Chip/Tag component (active/inactive, icon)
- [x] Modal component (overlay, escape close, aria-modal)
- [x] Toast/Notification component (4 types, auto-dismiss, stacking, global API)
- [x] ProgressBar component (determinate + indeterminate)
- [x] Spinner component (3 sizes)
- [x] EmptyState component (icon, title, description, action)
- [x] ErrorBoundary component (retry, fallback)
- [x] GameCard component (banner, name, slug, mod count, active state)
- [x] ModCard component (thumbnail, author, version, category, actions)
- [x] All components use CSS custom properties
- [x] All components have TypeScript props interfaces
- [x] Barrel export index.ts
- [x] CURRENT_TASK.md updated

### Phase 6: State Management
- [x] IpcAdapter created (typed wrapper over window.electronAPI)
- [x] useAppStore implemented (activeGameSlug, sidebarCollapsed)
- [x] useGameStore implemented (games, selectedGame, loadGames, selectGame, setGameDirectory)
- [x] useModStore implemented (mods, filter, CRUD, filteredMods selector)
- [x] useDownloadStore implemented (active/completed, start/cancel, event subscriptions)
- [x] useNotificationStore implemented (add/dismiss/clear, auto-dismiss)
- [x] Barrel export index.ts
- [x] CURRENT_TASK.md updated

### Phase 7: Feature Pages
- [x] Dashboard page: welcome section, real-time stats, game grid, empty state
- [x] Games page: detect button, GameCard grid, detail panel, set directory, manage mods
- [x] Installed Mods page: search, category chips, enabled/disabled filter, ModCard list, uninstall modal
- [x] Browse Mods page: "Coming Soon" placeholder
- [x] Downloads page: active downloads with progress/speed/ETA, cancel, history, status badges
- [x] Settings page: General/Downloads/Mod Management/Cache/Logging sections, save/reset
- [x] Logs page: search, level filter chips, color-coded log table, clear, entry count
- [x] All pages use stores for data
- [x] All pages handle loading and error states
- [x] CURRENT_TASK.md updated

### Phase 8: Integration & Polish
- [x] SideNav dynamically shows detected games from store
- [x] SideNav game items sync with router params (active game highlighting)
- [x] IpcListenerProvider: download progress/complete/error events → toast notifications
- [x] DragDropProvider: file drop overlay with validation (.zip/.7z/.rar)
- [x] ErrorBoundary wraps entire app
- [x] ToastContainer mounted globally
- [x] CSS variables: font-mono, text-body-xs added
- [x] CURRENT_TASK.md updated

### Phase 9: First Release
- [x] Version set to 1.0.0
- [x] Production Vite build succeeds (main + preload + renderer)
- [x] forge.config.ts configured (MakerZIP, VitePlugin)
- [x] index.html moved to project root for Forge Vite plugin
- [x] No TypeScript errors
- [x] All 35 tests pass
- [x] Documentation up to date
- [x] CURRENT_TASK.md updated to reflect release
