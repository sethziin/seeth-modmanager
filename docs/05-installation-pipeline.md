# Installation Pipeline

## Objective
Define the complete end-to-end pipeline for installing a mod — from the moment the user triggers installation to the mod being active in the game directory and registered in the system.

## Responsibility
- Specify every step of the installation process in order
- Define validation gates, backup strategy, file operations, and registration
- Govern rollback on failure
- Ensure atomicity guarantees at each stage

## Scope
Covers installation from local file (drag-and-drop, file picker) and from catalog download. Does not cover the download step itself (see `10-DOWNLOAD_SYSTEM.md`).

## Pipeline Overview

```
User Trigger → 1. Selection → 2. Validation → 3. Dependency Check → 4. Conflict Detection
→ 5. Backup → 6. Extraction → 7. File Copy → 8. Registry Update → 9. Completion
```

## Step-by-Step Pipeline

### Step 1: Selection
The user provides a mod source:
- **Local file**: Drag-and-drop or file picker → results in a file path
- **Catalog**: Browse mods → click install → results in a download URL or local path
- **Output**: Absolute path to a mod archive (`.zip`, `.7z`, `.rar`)

### Step 2: Validation
The provider's `validateMod()` method is called:
1. **Archive integrity**: Check the file exists, is readable, and is a recognized format
2. **Manifest parsing**: Look for `mod.json` inside the archive and parse it
3. **Schema validation**: Validate manifest against `ModManifest` schema
4. **Game match**: Verify `gameId` matches the target game
5. **No manifest fallback**: If no `mod.json`, attempt to infer structure, then prompt user for metadata
- **Output**: `ModValidation { valid, mod?: ModArchive, errors[] }`

### Step 3: Dependency Check
`DependencyService.checkModDependencies()`:
1. Parse dependencies from the manifest (or user-provided metadata)
2. Check each dependency against the dependency registry
3. Check game directory for known tool files
4. Collect missing required deps and optional warnings
- **Gate**: If required dependencies are missing → block install with resolution UI
- **Output**: `DependencyCheckResult { satisfied, missing[], warnings[] }`

### Step 4: Conflict Detection
`ModService.detectConflicts()`:
1. Read the mod registry for the target game
2. Compare files from the new mod against all installed mods' file lists
3. Identify overlapping files (same `destination` path)
4. For each conflict: determine the action (`add` vs `replace`)
- **Gate**: If conflicts exist → present conflict resolution UI to user:
  - **Skip**: Do not install conflicting files
  - **Overwrite**: Replace existing files with new ones
  - **Cancel**: Abort installation entirely
- **Output**: `ConflictReport { hasConflicts, conflicts[] }`

### Step 5: Backup
`BackupService.createBackup()`:
1. Collect files that will be replaced
2. Copy each file from the game directory to `<backupsDir>/<gameId>/<timestamp>/`
3. Compute SHA-256 of each original file
4. Write `manifest.json` listing backed-up files with their hashes
- **Conditional**: Only runs if `config.modManagement.createBackupBeforeInstall` is true
- **Output**: `BackupManifest { files[], timestamp }`

### Step 6: Extraction
`ArchiveService.extract()`:
1. Open the archive (`.zip` / `.7z` / `.rar`)
2. Read `mod.json` manifest from archive root
3. Extract files listed in manifest `files[].source` to a temporary staging directory
4. Verify SHA-256 hashes if provided in manifest
5. Clean up staging directory on failure
- **Output**: Path to staging directory with extracted files

### Step 7: File Copy
`GTAVProvider.installMod()` (or game-specific provider):
1. For each file in the manifest's `files[]`:
   - **When `action: 'add'`**: Copy from staging to `<gameDir>/<destination>`
   - **When `action: 'replace'`**: Copy from staging to `<gameDir>/<destination>` (original already backed up)
2. Preserve directory structure
3. Verify copied file hashes match manifest
- **Output**: `ModInstallResult { installedFiles[], conflicts[] }`

### Step 8: Registry Update
`ConfigService.writeModRegistry()`:
1. Generate a new `InstalledMod` entry from manifest + install result data
2. Compute and store SHA-256 hashes for each installed file
3. Append to the game's `mods.json`
4. Write atomically (temp file + rename)
- **Output**: Updated `mods.json` on disk

### Step 9: Completion
1. Clean up staging directory
2. Log installation success
3. Return `InstalledMod` to renderer
4. Update UI to show the mod in the installed list

## Rollback on Failure

If any step from 5 to 8 fails:

| Failure At | Rollback Action |
|------------|----------------|
| Step 5 (Backup) | Abort installation. No files changed. |
| Step 6 (Extraction) | Clean staging directory. No files changed. |
| Step 7 (File Copy) | Restore from backup created in Step 5. Remove any partially copied files. |
| Step 8 (Registry) | Files are already copied. Restore originals from backup. Remove any files that were 'add' actions. Do not update registry. |

## Pipeline Diagram

```
User Action          System Steps                  Output
───────────          ────────────                  ──────
                     
Pick file ──────→ 1. Selection                    filePath
                         │
                         ↓
                     2. Validation ──→ ModValidation (fail if invalid)
                         │
                         ↓
                     3. Dependency Check ──→ DependencyCheckResult (block if missing required)
                         │
                         ↓
                     4. Conflict Detection ──→ ConflictReport (user decision on conflicts)
                         │
                    [user resolves conflicts]
                         │
                         ↓
                     5. Backup ──→ BackupManifest (fail if backup fails)
                         │
                         ↓
                     6. Extraction ──→ Staging path (fail if corrupt)
                         │
                         ↓
                     7. File Copy ──→ ModInstallResult (fail → restore backup)
                         │
                         ↓
                     8. Registry Update ──→ updated mods.json (fail → restore + cleanup)
                         │
                         ↓
Show in UI ←──── 9. Completion ──→ InstalledMod object
```

## Staging Directory

Temporary extraction location: `<dataDir>/temp/staging/<modId>/`
- Created before extraction
- Deleted after successful installation
- Survives app restart for cleanup on next launch

## Criteria for Completion
- All 9 steps implemented in ModService
- Rollback handling for each step
- Conflict detection with user resolution UI
- Dependency checking integrated
- Backup/restore working end-to-end
- Installation from both local file and catalog download

## Next Steps
- Implement archive extraction service
- Update GTAVProvider.installMod() with real file copy
- Add conflict detection to ModService
- Wire dependency checks into ModService.installMod()
- Create staging directory management

## Relation to Other Documents
- `03-manifest.md` provides the metadata parsed in Step 2
- `04-dependencies.md` defines the dependency checks in Step 3
- `07-package-format.md` defines the archive structure extracted in Step 6
- `08-file-layout.md` defines the file system paths for staging and backups
- `09-MOD_SYSTEM.md` is the parent document for mod lifecycle
