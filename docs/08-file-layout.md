# File Layout

## Objective
Define the complete on-disk file layout for the Entropic State Mod Manager application data. This ensures all components read and write from consistent locations.

## Responsibility
- Specify the base data directory and all subdirectory structures
- Document every file the application creates
- Govern path resolution for all services

## Scope
Covers the application data directory structure, configuration files, game and mod registries, backups, cache, staging areas, and logs.

## Base Data Directory

```
%APPDATA%/entropic-state/       # Windows
  or ~/.config/entropic-state/  # Linux
  or ~/Library/Application Support/entropic-state/  # macOS
```

Resolved at runtime by `app.getPath('userData')`.

## Directory Tree

```
%APPDATA%/entropic-state/
├── config.json                     # Application configuration (Zod-validated)
├── games.json                      # Game registry (all detected/configured games)
│
├── games/                          # Per-game data
│   ├── gtav/
│   │   ├── mods.json               # Installed mod registry for GTA V
│   │   └── disabled/               # Staging area for disabled mod files
│   │       ├── <modId>/
│   │       │   ├── files/          # Copied original game files (when disabled replaces)
│   │       │   └── manifest.json   # Tracks original locations
│   │       └── ...
│   │
│   └── <gameId>/                   # Future games follow same structure
│       ├── mods.json
│       └── disabled/
│
├── backups/                        # Pre-install backups
│   └── gtav/
│       ├── 2026-07-20T10-30-00Z/   # Timestamp-named backup snapshot
│       │   ├── manifest.json       # Backup manifest (original paths + hashes)
│       │   └── files/              # Original files before mod installation
│       │       ├── ScriptHookV.dll
│       │       └── ...
│       │
│       └── <timestamp>/
│
├── cache/                          # Cache directory
│   ├── downloads/                  # Downloaded mod archives
│   │   ├── <downloadId>/
│   │   │   ├── archive.zip         # The downloaded file
│   │   │   └── metadata.json       # Download metadata
│   │   └── ...
│   │
│   └── catalogs/                   # Cached catalog data
│       └── local/
│           └── catalog.json        # Local catalog file
│
├── temp/                           # Temporary files
│   ├── staging/                    # Extracted mod files during installation
│   │   └── <modId>/
│   │       └── files/              # Extracted file tree
│   │
│   └── downloads/                  # In-progress download fragments
│       └── <downloadId>.part
│
├── logs/                           # Log files
│   ├── main.log                    # Current main process log
│   ├── main.1.log                  # Rotated log (10MB max per file)
│   └── main.2.log                  # Rotated log
│
└── dependencies.json               # Detected tool/library dependencies
```

## File Descriptions

### config.json
- **Schema**: `AppConfig` (defined in `15-CONFIGURATION.md`)
- **Validator**: Zod `appConfigSchema`
- **Write strategy**: Atomic (temp file + rename)
- **Example path**: `%APPDATA%/entropic-state/config.json`

### games.json
- **Schema**: `GameRegistry { version, games: Record<gameId, GameRegistryEntry> }`
- **Validator**: Zod `gameRegistrySchema`
- **Write strategy**: Atomic per operation
- **Example path**: `%APPDATA%/entropic-state/games.json`

### mods.json (per game)
- **Schema**: `ModRegistry { version, gameId, mods: ModRegistryEntry[] }`
- **Validator**: Zod `modRegistrySchema`
- **Write strategy**: Atomic per operation
- **Example path**: `%APPDATA%/entropic-state/games/gtav/mods.json`

### Backup manifest.json
- **Schema**: `BackupManifest { timestamp, gameId, gameVersion, files: BackupFile[] }`
- **Each entry**: `{ relativePath, originalHash, size }`
- **Example path**: `%APPDATA%/entropic-state/backups/gtav/2026-07-20T10-30-00Z/manifest.json`

### Disabled manifest.json (per mod)
- **Schema**: `{ originalFiles: { relativePath, destinationPath }[] }`
- **Example path**: `%APPDATA%/entropic-state/games/gtav/disabled/<modId>/manifest.json`

### Catalog file
- **Schema**: `Catalog { version, source, updatedAt, entries: CatalogEntry[] }`
- **Example path**: `%APPDATA%/entropic-state/cache/catalogs/local/catalog.json`

### Dependencies file
- **Schema**: `{ version, dependencies: Record<id, DependencyState> }`
- **Example path**: `%APPDATA%/entropic-state/dependencies.json`

## Path Resolution

Paths are resolved through a `PathResolver` utility that centralizes all filesystem path construction:

```typescript
class PathResolver {
  constructor(dataDir: string)
  
  // Config files
  configFile(): string
  gameRegistryFile(): string
  modRegistryFile(gameId: string): string
  dependenciesFile(): string
  
  // Game data
  disabledDir(gameId: string, modId: string): string
  disabledManifestFile(gameId: string, modId: string): string
  
  // Backups
  backupsDir(gameId: string): string
  backupDir(gameId: string, timestamp: string): string
  backupManifestFile(gameId: string, timestamp: string): string
  
  // Cache
  cacheDir(): string
  downloadsDir(): string
  downloadDir(downloadId: string): string
  catalogsDir(): string
  
  // Temp
  tempDir(): string
  stagingDir(modId: string): string
  
  // Logs
  logsDir(): string
}
```

## directory Service

All directory creation is handled by `ConfigService.ensureDirectories()` during app startup. The following directories are guaranteed to exist before any operation:

- `games/<gameId>/` (created on first game detection)
- `backups/<gameId>/` (created on first backup)
- `cache/downloads/`
- `temp/`
- `logs/`

## Security Constraints

All file operations are restricted to known directories via `FileSystemService` path validation:
- Game install directories (detected or user-specified)
- The application data directory tree
- User-selected directories (via file picker)

Paths outside these bounds are rejected.

## Criteria for Completion
- PathResolver implemented and used by all services
- All directories created on startup
- Atomic write strategy for all JSON files
- Path validation restricts operations to allowed directories

## Next Steps
- Implement PathResolver utility
- Update ConfigService to use PathResolver
- Update all services to use PathResolver

## Relation to Other Documents
- `07-FILE_SYSTEM.md` defines the sandboxed file operations used on these paths
- `05-installation-pipeline.md` references staging, backup, and game paths
- `15-CONFIGURATION.md` defines the config.json schema
- `16-LOGGING.md` defines the log file naming and rotation
