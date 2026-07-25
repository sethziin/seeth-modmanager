# Changelog — Seeth's Mod Manager v1.0.0

## v1.0.0 (2026-07-24)

### New Features

#### Mod Installation Pipeline
- Full 9-step installation pipeline: Selection → Validation → Dependency Check → Conflict Detection → Backup → Extraction → File Copy → Registry Update → Completion
- `validateMod` now parses ZIP archives, reads `mod.json` manifests, and returns real metadata
- SHA-256 hash tracking for every installed file
- Backup creation before installation (configurable)
- Staging directory with UUID isolation
- Rollback on failure with automatic file restore

#### Enable/Disable with Staging
- Disable: moves files to `disabled/<modId>/` directory, restores originals from backup when applicable
- Enable: restores files from staging back to game directory
- Hash ownership verification: files modified by user are never silently overwritten or removed
- Disabled manifest tracking

#### Uninstall with Safety
- File removal based on registry file list
- Backup restoration for replaced files
- Hash verification before removal (skips user-modified files)
- Cleanup of empty parent directories
- Disabled directory cleanup

#### Drag & Drop Installation
- Drop `.zip`, `.7z`, `.rar` files directly onto the app
- Auto-detects game selection (single game = auto-install)
- Progress toasts for validation, extraction, backup, copy, registration
- Error handling with user-friendly messages

#### Browse Mods Catalog
- 8 GTA V mods in bundled catalog (NaturalVision, ScriptHookVDotNet, Chaos Mod, Menyoo, LSPDFR, VisualV, Simple Trainer, Real Traffic)
- Search by name, author, tags, description
- Filter by category (Graphics, Gameplay, Scripts, Tools, etc.)
- Sort by rating, name, date, downloads
- Responsive grid layout

#### Download Manager
- Queue-based download with configurable concurrency (default 3)
- Progress tracking with speed and ETA
- Retry with exponential backoff (configurable)
- SHA-256 checksum verification
- Cancel support via AbortController

### Architecture

#### PathResolver
- Centralized path construction for all file system locations
- Dev/Production data directory separation (`userData` vs `userData-dev`)
- 25 path methods covering config, registry, backups, cache, temp, logs, disabled mods, catalogs

#### CatalogService (Provider Pattern)
- `CatalogProvider` interface for pluggable catalog sources
- `LocalCatalogProvider` reads from `catalog.json` on disk
- Fallback to bundled data when no catalog exists
- `CatalogService` aggregates multiple providers

#### DependencyService
- Game-level dependency registration (ScriptHookV, etc.)
- Tool scanning via detect files
- Mod dependency validation during install
- Dependents guard (blocks uninstall when other mods depend)

### Documentation
- 7 new architecture spec documents created
- 6 existing documents updated for consistency
- 16 divergences identified and classified (A/B/C)
- ADR-010, ADR-011, ADR-012 added to decision log

### Bug Fixes
- Font changed from Geist to DM Sans + Outfit + JetBrains Mono (AI slop fix)
- Sidebar border-right removed (design improvement)
- Card borders removed from all card-like components
- Active navigation state uses neutral background instead of primary color
- TitleBar navigation removed (duplicate with SideNav)
- Empty states redesigned from centered icon-above to inline layout
- ProgressBar switched from `transition: width` to `transform: scaleX()`

### Known Limitations (v1)
- Only GTA V supported (architecture supports multi-game)
- Browse catalog is bundled (8 mods) — no remote fetch yet
- Download button opens external URLs (no download→install pipeline)
- Enable/Disable file operations require backup for replace-type files
- No mod conflict resolution UI (backend detects, frontend doesn't prompt)
- No mod profiles/presets
- No community API integration (Nexus Mods, etc.)
- Epic Games detection incomplete (Steam + Registry detection work)
- 7z/RAR extraction not implemented (ZIP only)
