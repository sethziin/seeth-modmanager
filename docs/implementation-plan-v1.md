# Implementation Plan v1

## Architecture Consolidation Summary

### Source of Truth

| Document | Status | Purpose |
|----------|--------|---------|
| `docs/03-ARCHITECTURE.md` | Spec | System architecture, patterns, security model |
| `docs/08-GAME_SYSTEM.md` | Spec | GameProvider interface, detection, validation |
| `docs/09-MOD_SYSTEM.md` | Spec | Mod lifecycle, registry, enable/disable strategy |
| `docs/02-catalog.md` | Spec | Catalog system for browsing mods |
| `docs/03-manifest.md` | Spec | Mod manifest format (mod.json) |
| `docs/04-dependencies.md` | Spec | Dependency system |
| `docs/05-installation-pipeline.md` | Spec | Full install pipeline (9 steps) |
| `docs/07-package-format.md` | Spec | Archive format and structure |
| `docs/08-file-layout.md` | Spec | On-disk file layout |
| `docs/ARCHITECTURE_DECISIONS.md` | Invariant | Architectural invariants |
| `docs/20-DECISIONS.md` | ADR Log | Specific ADRs (updated) |
| `docs/14-THEMING.md` | Spec | Font/color tokens (updated) |
| `docs/12-COMPONENTS.md` | Spec | Component specs (updated) |

### Key Decisions Already Made (ADRs Updated)
- ADR-010: DM Sans + Outfit + JetBrains Mono
- ADR-011: Unified sidebar navigation (TitleBar without nav)
- ADR-012: adm-zip for archive extraction

---

## Implementation Order

```
Milestone 1: Foundation ──────────────────────→ Milestone 4: Polish
    │                                                    │
    ├── PathResolver                                      ├── Drag-drop UI
    ├── Dev/Prod separation                               ├── DownloadService UI
    ├── ArchiveService                                    ├── Error handling edge cases
    │                                                    └── Tests
    ↓
Milestone 2: Pipeline Core ──────────────────→ Milestone 5: Catalog (Future)
    │                                                    │
    ├── validateMod (real)                                ├── CatalogService
    ├── installMod (real)                                 ├── LocalCatalogProvider
    ├── Conflict detection                                ├── BrowseModsPage
    ├── Backup integration                                └── DependencyService
    │
    ↓
Milestone 3: Lifecycle Ops
    │
    ├── Enable/Disable staging
    ├── Uninstall file removal
    └── Mod registry hash tracking
```

---

## Milestone 1: Foundation

**Goal**: Establish the infrastructure that all subsequent work depends on. No user-visible changes yet.

### 1.1 Install Dependency

| Action | Detail |
|--------|--------|
| Install | `pnpm add adm-zip` |
| Install dev types | `pnpm add -D @types/adm-zip` |
| Update `docs/02-STACK.md` | Confirm `adm-zip` in Key Libraries |

### 1.2 PathResolver Utility

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/path-resolver.ts` |
| Purpose | Centralize all filesystem path construction |
| Methods | `configFile()`, `gameRegistryFile()`, `modRegistryFile(gameId)`, `backupsDir(gameId)`, `backupDir(gameId, timestamp)`, `disabledDir(gameId, modId)`, `cacheDir()`, `downloadsDir()`, `downloadDir(id)`, `stagingDir(modId)`, `tempDir()`, `logsDir()` |
| Pattern | Stateless utility, instantiated with `dataDir` |
| Test | Verify all paths resolve correctly on Win32 |
| Depends on | Nothing |
| Blocks | All file operations in later milestones |

### 1.3 Dev/Prod Data Directory Separation

| Aspect | Detail |
|--------|--------|
| File | `src/main/main.ts` (modify) |
| Logic | `const DATA_DIR = app.isPackaged ? path.join(app.getPath('userData')) : path.join(app.getPath('userData') + '-dev')` |
| Test | Verify different paths for dev vs packaged |
| Depends on | Nothing |
| Blocks | Data safety during development |

### 1.4 ArchiveService

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/archive-service.ts` |
| Methods | `extractAll(archivePath, destDir): Result<string[]>`, `listFiles(archivePath): Result<string[]>`, `readFile(archivePath, filePath): Result<Buffer>`, `findManifest(archivePath): Result<ModManifest \| null>` |
| Formats | ZIP (adm-zip), 7z/RAR (future — error with clear message if unsupported) |
| Test | Extract known ZIP, list contents, find mod.json, handle corrupt archives |
| Depends on | adm-zip |
| Blocks | Milestone 2 (validateMod needs archive parsing) |

### Milestone 1 Dependencies
```
PathResolver ─> Dev/Prod separation
PathResolver ─> ArchiveService (paths for staging)
```

### Milestone 1 Tests
- PathResolver: all path methods return correct strings
- ArchiveService: extract, listFiles, readFile, findManifest
- Dev/Prod: app.isPackaged check switching data dirs

---

## Milestone 2: Pipeline Core

**Goal**: Make the install pipeline actually copy files and track them correctly.

### 2.1 ManifestReader

| Aspect | Detail |
|--------|--------|
| File | `src/shared/lib/manifest-reader.ts` (shared) |
| Methods | `findAndParse(archivePath): Result<ModManifest>`, `validate(manifest, gameId, gameVersion): Result<ModManifestValidation>` |
| Logic | Uses ArchiveService.readFile to read `mod.json` from archive root. Parses JSON, validates against expected schema. Falls back to null if no manifest exists. |
| Test | Read known good manifest, read archive without manifest, reject invalid JSON |
| Depends on | ArchiveService |
| Blocks | validateMod |

### 2.2 Update GTAVProvider.validateMod()

| Aspect | Detail |
|--------|--------|
| File | `src/main/providers/gtav.provider.ts` |
| Current | Stub — only checks `fileExists` |
| New | 1. Call `ArchiveService.listFiles()` to enumerate archive contents. 2. Call `ManifestReader.findAndParse()` to get metadata. 3. Build `ModArchive` from manifest + file list (if no manifest, build from flat file list). 4. Return `ModValidation { valid, mod: ModArchive, errors[] }`. |
| Test | Validate valid mod → returns ModArchive with files. Validate corrupt archive → returns errors. Validate archive without manifest → returns flat file list. |
| Depends on | ArchiveService, ManifestReader |
| Blocks | installMod, installMod metadata |

### 2.3 Update GTAVProvider.installMod()

| Aspect | Detail |
|--------|--------|
| File | `src/main/providers/gtav.provider.ts` |
| Current | Stub — returns empty `installedFiles: []` |
| New | 1. Receive `ModArchive` + `installPath` + `stagingDir`. 2. For each file in `ModArchive.files`: copy from staging to `<installPath>/<destination>`. 3. Compute SHA-256 of copied file. 4. Return `ModInstallResult { modId: '', installedFiles: string[], conflicts: [] }`. |
| Test | Install files to temp dir → verify files exist with correct content. Handle write errors → return error. |
| Depends on | Milestone 1 (ArchiveService for extraction) |
| Blocks | ModService.installMod |

### 2.4 Update ModService.installMod()

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/mod-service.ts` |
| Current | Calls validateMod (stub), ignores result, writes "Unknown" metadata |
| New | 1. Call `provider.validateMod(path)` → gets `ModArchive`. 2. Call `ArchiveService.extractAll()` to staging dir. 3. Call `provider.installMod(archive, installPath, stagingDir)` → gets file list + hashes. 4. Build `ModFile[]` with hashes. 5. Backup (existing, now with real file data). 6. Write registry entry with real metadata from ModArchive. 7. Clean up staging. |
| Test | Full integration test with mock provider. Verify files copied, registry written, backup created. |
| Depends on | 2.2, 2.3, Milestone 1 |
| Blocks | Conflict detection |

### 2.5 Conflict Detection

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/mod-service.ts` (new method) |
| Method | `detectConflicts(gameId, modArchive): Result<Conflict[]>` |
| Logic | 1. Read mod registry for game. 2. Compare files from new mod against all installed mods' file lists. 3. Return list of conflicts with mod name + file path. |
| Integration | Called in installMod before extraction. If conflicts exist, return them to renderer for user decision. |
| Test | Install mod A, attempt mod B with overlapping file → conflict detected. |
| Depends on | Milestone 1, 2.2 |
| Blocks | Install flow (user resolution) |

### 2.6 Backup Integration

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/mod-service.ts` (existing) |
| Current | Backup called with empty list (no files to backup) |
| New | Pass real file list from installMod to BackupService.createBackup() |
| Test | Verify backup files created and manifest written |
| Depends on | 2.4 |
| Blocks | Rollback capability |

### Milestone 2 Dependencies
```
ArchiveService ─> ManifestReader ─> validateMod
                                    └─> installMod
                                         └─> ModService.installMod
                                              └─> Conflict detection
                                              └─> Backup integration
```

### Milestone 2 Tests
- validateMod with real ZIP containing mod.json → returns valid ModArchive
- validateMod with flat ZIP (no mod.json) → returns inferred file list
- validateMod with corrupt file → returns error
- installMod copies files to correct destination
- Conflict detection finds overlapping files
- Full install integration: validate → extract → backup → copy → registry

---

## Milestone 3: Lifecycle Operations

**Goal**: Enable/Disable and Uninstall actually manipulate files.

### 3.1 Staging Directory for Disabled Mods

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/mod-service.ts` (new methods) |
| Structure | `<dataDir>/games/<gameId>/disabled/<modId>/` with `manifest.json` + `files/` |
| Enable | Move files from staging back to game directory. Update registry `enabled: true`. |
| Disable | Move mod files from game directory to staging. If files were replaced, restore originals from backup. Update registry `enabled: false`. |
| Test | Disable mod → files moved to staging, enable → files restored. Disable mod that replaced files → originals restored from backup. |
| Depends on | Milestone 2 (files are actually tracked now) |
| Blocks | 3.3 |

### 3.2 Uninstall with File Removal

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/mod-service.ts` (modify) |
| Current | Only removes registry entry |
| New | 1. Check dependencies (does any other mod depend on this?). 2. Call provider.uninstallMod() to delete files from game directory. 3. If files were replaced, restore from latest backup. 4. Remove staging directory if exists. 5. Remove registry entry. |
| Test | Uninstall mod → files deleted from game dir, registry entry removed. Uninstall mod with dependents → blocked. |
| Depends on | Milestone 2, 3.1 |
| Blocks | N/A |

### 3.3 Registry Hash Tracking

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/mod-service.ts` (modify) |
| Current | `originalHash` and `modHash` are empty strings |
| New | After install, compute SHA-256 for each copied file and store both `originalHash` (if replacing) and `modHash`. |
| Test | Installed mod has correct hashes in registry. |
| Depends on | Milestone 2 |

### Milestone 3 Dependencies
```
Milestone 2 files tracking ─> Disable staging
                            ─> Uninstall file removal
                            ─> Hash tracking
```

### Milestone 3 Tests
- Enable moves files back
- Disable moves files to staging, restores originals
- Uninstall deletes files and removes registry entry
- Uninstall blocked if other mods depend on it
- Hashes stored correctly in registry

---

## Milestone 4: UI Integration

**Goal**: Connect existing backend capabilities to the frontend.

### 4.1 Drag-and-Drop Installation

| Aspect | Detail |
|--------|--------|
| File | `src/renderer/app/DragDropProvider.tsx` |
| Current | Accepts drop, shows toast only |
| New | 1. Get list of detected games from useGameStore. 2. If one game: auto-select. If multiple: show game picker modal. 3. Call `useModStore.installMod(gameId, filePath)`. 4. Show progress/result toast. |
| Depends on | Milestone 2 |
| Blocks | N/A |

### 4.2 DownloadService UI Integration

| Aspect | Detail |
|--------|--------|
| File | `src/renderer/features/downloads/DownloadsPage.tsx` |
| Current | Basic page, no real data |
| New | 1. Subscribe to `useDownloadStore` (already wired to IPC events). 2. Show active downloads with progress bar + speed + ETA. 3. Show completed downloads list. 4. Cancel button for active downloads. 5. Auto-install completed mod downloads (if metadata indicates). |
| Depends on | Milestone 2 (install pipeline ready for downloaded files) |
| Blocks | N/A |

### 4.3 Progress Events for Install

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/mod-service.ts` + IPC |
| New | Emit `mod:install-progress` events during extraction and file copy (already typed in IpcPushEvents but never sent) |
| Depends on | Milestone 2 |
| Blocks | N/A |

### Milestone 4 Dependencies
```
Milestone 2 ─> Drag-and-drop install
             ─> Download page
             ─> Install progress events
```

### Milestone 4 Tests
- Drag-and-drop install flow (integration)
- Download progress display updates correctly
- Install progress events render in UI

---

## Milestone 5: Catalog & Dependencies (Post-v1)

**Goal**: Enable BrowseModsPage and dependency management. Lower priority.

### 5.1 CatalogService + LocalCatalogProvider

| Aspect | Detail |
|--------|--------|
| Files | `src/main/services/catalog-service.ts`, `src/main/providers/catalog/local-catalog-provider.ts` |
| Function | Read/search local catalog.json, provide entries to BrowseModsPage |
| Test | Search catalog returns matching entries |

### 5.2 DependencyService

| Aspect | Detail |
|--------|--------|
| File | `src/main/services/dependency-service.ts` |
| Function | Register game deps, scan for tools, check mod deps during install/disable/uninstall |
| Test | Missing required dep blocks install |

### 5.3 BrowseModsPage

| Aspect | Detail |
|--------|--------|
| File | `src/renderer/features/mods/BrowseModsPage.tsx` |
| Current | "Coming Soon" placeholder |
| New | Catalog search + list + install button |
| Depends on | 5.1, 5.2, Milestone 2 |

---

## Testing Strategy

### Per-Milestone Test Requirements

| Milestone | Unit Tests | Integration Tests |
|-----------|-----------|-------------------|
| M1 | PathResolver, ArchiveService | ArchiveService with real .zip file |
| M2 | ManifestReader, validateMod, installMod, conflict detection | Full install pipeline (stub game dir) |
| M3 | Enable/Disable staging, uninstall, hash tracking | Enable → disable → enable cycle |
| M4 | Component rendering | Drag-and-drop → install (full E2E) |
| M5 | CatalogService, DependencyService | Browse → install from catalog |

### Testing Approach
- **Unit tests**: Vitest, mock file system ops where needed
- **Integration tests**: Use temp directories for real file operations
- **Existing tests**: 35 tests (LogService, ConfigService, FileSystemService) — must continue passing
- **New test files**: One per service (path-resolver.test.ts, archive-service.test.ts, etc.)

### Test File Locations
```
src/main/services/__tests__/
  path-resolver.test.ts
  archive-service.test.ts
  mod-service.test.ts       # extend existing

src/main/providers/__tests__/
  gtav-provider.test.ts     # new

src/shared/lib/__tests__/
  manifest-reader.test.ts   # new
```

---

## Directory Structure (After Plan)

```
src/main/
  services/
    path-resolver.ts         # NEW
    archive-service.ts       # NEW
    mod-service.ts           # MODIFY
    game-service.ts          # existing
    config-service.ts        # existing
    filesystem-service.ts    # existing
    backup-service.ts        # existing
    download-service.ts      # existing
    log-service.ts           # existing
    cache-service.ts         # existing
  providers/
    gtav.provider.ts         # MODIFY (validateMod, installMod)
  ipc/                       # existing (minor mods for progress events)

src/shared/
  lib/
    manifest-reader.ts       # NEW
  types/                     # existing

src/renderer/
  app/
    DragDropProvider.tsx     # MODIFY
  features/
    downloads/
      DownloadsPage.tsx      # MODIFY
    mods/
      BrowseModsPage.tsx     # MODIFY (Milestone 5)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| adm-zip has compatibility issues with Electron 33 sandbox | Low | High | Test in dev first; fallback to node-stream-zip |
| Game directory write permissions on locked Windows installs | Medium | Medium | Always test with temp dir first; clear error messages |
| Staging directory conflicts between concurrent installs | Low | Medium | Use UUID-based staging dirs (already in place) |
| Registry corruption on crash during write | Low | High | Already mitigated by atomic writes (temp + rename) |
| Large mod archives (10GB+) timeout extraction | Low | Low | Stream extraction; progress events; user feedback |

---

## Roadmap Timeline

| Milestone | Estimated Effort | User-Visible Result |
|-----------|-----------------|---------------------|
| M1 Foundation | 2-3 sessions | None (infrastructure) |
| M2 Pipeline Core | 4-5 sessions | Mods actually install files |
| M3 Lifecycle Ops | 2-3 sessions | Enable/disable/uninstall work |
| M4 UI Integration | 2 sessions | Drag-drop, download page work |
| M5 Catalog (post-v1) | 3-4 sessions | Browse mods functional |

**Total**: ~13-17 sessions for a functional v1 with real mod operations.

---

## Plan Approval

This plan is based on the consolidated architecture after normalizing divergences. Milestones M1-M4 are required for a usable mod manager. M5 extends the feature set without blocking the core use case.

**Next step after approval**: Begin Milestone 1 implementation in order (1.1 → 1.2 → 1.3 → 1.4).

---

## V1 Release Summary

### Actual Effort
| Milestone | Sessions | Status |
|-----------|----------|--------|
| M1 Foundation | 1 | ✅ Complete |
| M2 Pipeline Core | 1 | ✅ Complete |
| M3 Lifecycle Ops | 1 | ✅ Complete |
| M4 UI Integration | 1 | ✅ Complete |
| M5 Catalog + Dependencies | 1 | ✅ Complete |
| **Total** | **5 sessions** | **All complete** |

### Key Metrics
- **Test files**: 11
- **Tests**: 126 (all passing)
- **TypeScript errors**: 0 (strict mode)
- **Services created**: 12 (Log, Config, FileSystem, Cache, Backup, Game, Mod, Download, PathResolver, Archive, Catalog, Dependency)
- **IPC handlers**: 9 (window, app, config, log, fs, game, mod, download, catalog)

### Files Created Across Milestones
| Area | Files |
|------|-------|
| Services | `path-resolver`, `archive-service`, `mod-validator`, `mod-installer`, `catalog-service`, `dependency-service` |
| Libraries | `manifest-reader` |
| IPC | `catalog.ipc` |
| Frontend | `DragDropProvider` (rewrite), `BrowseModsPage` (rewrite) + CSS |
| Preload | `preload.ts` (mod.onInstallProgress, catalog namespace) |
| Config/Ipc | `ipc-adapter.ts` (catalog namespace) |
| Config/Error | `error.ts` (9 new ErrorCodes) |
