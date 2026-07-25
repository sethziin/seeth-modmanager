# 18-ROADMAP

## Objective
Define the precise, step-by-step development roadmap from the first commit to the initial release (v1.0.0) of the Entropic State Mod Manager.

## Responsibility
Act as the master sequence guide for all AI agents implementing the project. Ensure strict adherence to the chronological phase progression to prevent dependency hell or architectural drift.

## Scope
Covers all development phases including project setup, core backend services, IPC layer, shared types, UI foundation, state management, feature pages, integration, and final packaging.

## Dependencies
- `00-README.md` (Project overview and reading order)
- `19-CURRENT_TASK.md` (Task execution tracking)
- `20-DECISIONS.md` (Architectural constraints)

## Criteria for Completion
- All 9 phases are fully detailed with actionable checkboxes.
- Strict phase-blocking rules are explicitly stated and enforced.

## Next Steps
- Initialize Phase 0 in the codebase.
- Keep `19-CURRENT_TASK.md` synchronized with progress through this roadmap.

## Relation to Other Documents
Dictates the tasks tracked in `19-CURRENT_TASK.md` and realizes the architectural vision defined in `20-DECISIONS.md`.

---

## Development Roadmap

### Phase 0: Project Setup (Days 1-2)
**Goal**: Initialize project, install dependencies, configure build system
- [ ] Initialize Electron Forge project with Vite template
- [ ] Install all dependencies (React, Zustand, React Router, zod, electron-log, electron-store, etc.)
- [ ] Configure TypeScript strict mode
- [ ] Configure ESLint + Prettier
- [ ] Set up Vitest
- [ ] Create folder structure (src/main, src/preload, src/renderer, src/shared)
- [ ] Verify dev server runs and shows blank window
- [ ] Configure custom window (frameless, background color #131315, min size)
**Dependencies**: None
**Output**: Empty Electron app that opens a dark window

### Phase 1: Core Backend Services (Days 3-6)
**Goal**: Implement all backend services without UI
- [ ] Implement LogService
- [ ] Implement ConfigService with zod schemas
- [ ] Implement FileSystemService
- [ ] Implement CacheService
- [ ] Define GameProvider interface
- [ ] Implement GTAVProvider (detection, validation, mod operations)
- [ ] Implement GameService (provider registry)
- [ ] Implement BackupService
- [ ] Implement ModService (install, uninstall, enable, disable)
- [ ] Implement DownloadService (queue, progress, retry)
- [ ] Write unit tests for all services
**Dependencies**: Phase 0
**Output**: Fully functional backend with tests passing

### Phase 2: IPC Layer (Days 7-8)
**Goal**: Connect backend services to renderer via IPC
- [ ] Define all IPC channel types in src/shared/types/ipc.types.ts
- [ ] Implement preload script with typed electronAPI
- [ ] Implement IPC handlers for each domain (game, mod, download, config, fs, window, app, log)
- [ ] Test IPC round-trips from renderer console
**Dependencies**: Phase 1
**Output**: All backend functionality accessible from renderer

### Phase 3: Shared Types & Schemas (Days 8-9)
**Goal**: Define all shared type definitions
- [ ] Game types (DetectedGame, GameDetails, GameInstallation, etc.)
- [ ] Mod types (InstalledMod, ModFile, ModCategory, ModUpdate, etc.)
- [ ] Download types (DownloadItem, DownloadProgress, DownloadMetadata, etc.)
- [ ] Config types (AppConfig, GameConfig, etc.)
- [ ] IPC types (channel map, request/response types)
- [ ] Zod schemas for all JSON files
**Dependencies**: Phase 1
**Output**: Complete type system shared between main and renderer

### Phase 4: Design System & Layout Shell (Days 10-12)
**Goal**: Implement the visual foundation
- [ ] Create CSS custom properties (variables.css) with full color, typography, spacing tokens
- [ ] Create reset.css
- [ ] Create typography.css
- [ ] Create scrollbar.css
- [ ] Create animations.css
- [ ] Load fonts: DM Sans (body), Outfit (display), JetBrains Mono (code)
- [ ] Build TitleBar component (drag region, brand, window controls)
- [ ] Build SideNav component (navigation items, active states, version display)
- [ ] Build StatusBar component (system status, sync, version)
- [ ] Build Layout shell (TitleBar + SideNav + Content Outlet + StatusBar)
- [ ] Configure React Router with HashRouter
- [ ] Create placeholder pages for all routes
**Dependencies**: Phase 2, Phase 3
**Output**: App shell with navigation, all pages route correctly, design tokens applied

### Phase 5: Shared UI Components (Days 13-15)
**Goal**: Build reusable component library
- [ ] Button component (primary, secondary, ghost, danger variants)
- [ ] Card component
- [ ] Input component (with icon support)
- [ ] Toggle component
- [ ] Chip/Tag component
- [ ] Modal component
- [ ] Toast/Notification component + notification system
- [ ] ProgressBar component
- [ ] Spinner component
- [ ] EmptyState component
- [ ] ErrorBoundary component
- [ ] GameCard component
- [ ] ModCard component
**Dependencies**: Phase 4
**Output**: Complete component library matching True Dark Desktop design

### Phase 6: State Management (Days 16-17)
**Goal**: Implement Zustand stores
- [ ] gameStore with all actions
- [ ] modStore with all actions
- [ ] downloadStore with all actions + IPC listeners
- [ ] configStore with all actions
- [ ] notificationStore
- [ ] uiStore
- [ ] Write tests for all store actions
**Dependencies**: Phase 4, Phase 5
**Output**: All stores functional and tested

### Phase 7: Feature Pages (Days 18-24)
**Goal**: Implement all feature pages
- [ ] Dashboard page (welcome section, current game card, quick stats, recent activity)
- [ ] Games page (game cards grid, detect games, setup profile, manual locate)
- [ ] Installed Mods page (mod cards grid/list, search, filter by category, sort, toggle enable/disable, uninstall, update)
- [ ] Browse Mods page (featured hero, trending grid, search, tags, install button) - NOTE: initially mock data, real integration later
- [ ] Downloads page (download queue, progress bars, actions)
- [ ] Settings page (all config sections with form controls)
- [ ] Logs page (log viewer with filtering, search, clear)
**Dependencies**: Phase 5, Phase 6
**Output**: All pages functional with real data from backend

### Phase 8: Integration & Polish (Days 25-28)
**Goal**: Full integration testing and UI polish
- [ ] End-to-end flow: detect GTA V → view details → install mod → enable/disable → uninstall
- [ ] Download flow: start download → track progress → auto-install
- [ ] Error handling: test all error paths, verify notifications
- [ ] Window controls: minimize, maximize, close all work
- [ ] Responsive behavior: resize window, check minimum size
- [ ] Custom scrollbars work throughout
- [ ] Active navigation states sync with router
- [ ] Transitions and animations smooth
- [ ] Performance: no lag, smooth scrolling
**Dependencies**: Phase 7
**Output**: Polished, fully integrated application

### Phase 9: First Release (Days 29-30)
**Goal**: Package and distribute
- [ ] Build production bundle
- [ ] Package as Windows executable
- [ ] Test packaged app on clean machine
- [ ] Create GitHub release
- [ ] Update documentation
- [ ] Tag v1.0.0
**Dependencies**: Phase 8
**Output**: v1.0.0 release ready for distribution

### Future Phases (Post v1.0.0)
- Mod profiles/presets
- Community mod browsing (real API integration)
- Mod conflict resolution UI
- Auto-update system
- Support for The Witcher 3
- Support for Cyberpunk 2077
- Mod dependency graph visualization
- Play time tracking

## IMPORTANT RULES:
- NEVER start a phase without completing the previous one
- NEVER start frontend (Phase 4+) before backend is complete and tested (Phase 1)
- ALWAYS run tests before moving to next phase
- ALWAYS update CURRENT_TASK.md and DECISIONS.md as you progress
