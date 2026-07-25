# File System Operations

## Objective
To safely and efficiently manage all file-based operations required by the Entropic State Mod Manager, completely isolated within the main process to ensure security and predictability.

## Responsibility
- Manage application data, caches, logs, and game-specific directories.
- Perform robust file operations (copy, move, delete, extract) required for mod management.
- Implement strict path validations and safety fallbacks.
- Maintain a comprehensive backup strategy for reversible modifications.

## Scope
Defines the `FileSystemService` architecture, directory layouts (global and per-game), allowed operations, rigorous safety and path traversal rules, and backup/rollback strategies. Focus is placed particularly on GTA V requirements as a primary use case.

## Dependencies
- [06-IPC.md](06-IPC.md) - For how file system tasks trigger IPC progress events or errors.
- [08-GAME_SYSTEM.md](08-GAME_SYSTEM.md) - For mod installation operations driven by the Game Providers.

## Overview
All file system operations go through `FileSystemService` in the main process. The renderer NEVER accesses the file system directly.

## Application Directories
```text
%APPDATA%/entropic-state/
├── config.json                    # App-wide settings
├── games.json                     # Registered games registry
├── games/
│   └── gtav/                      # Per-game directory
│       ├── mods.json              # Mod registry for this game
│       └── backups/               # Mod backups
│           └── [timestamp]/       # Timestamped backup
├── cache/
│   └── downloads/                 # Downloaded files cache
├── logs/
│   ├── main.log                   # Current log file
│   └── main.old.log               # Rotated log
└── temp/                          # Temporary extraction directory
```

## GTA V Specific Paths
GTA V installation directory structure:
```text
[GTA V Root]/
├── GTA5.exe
├── GTAVLauncher.exe
├── scripts/                       # .asi, .dll script mods
├── mods/                          # OpenIV mods directory
│   └── update/
│       └── update.rpf
├── update/
│   └── update.rpf                 # Game updates
├── dinput8.dll                    # ScriptHookV
├── ScriptHookV.dll
└── NativeTrainer.asi
```

## File Operations
- **Copy**: Used for mod installation (copy mod files to game directory)
- **Move**: Used for enabling/disabling mods (move to/from staging)
- **Delete**: Used for mod uninstallation (remove files from game directory)
- **Archive extraction**: Support `.zip`, `.rar`, `.7z` via decompress library
- **Directory creation**: Ensure directories exist before operations
- **File watching**: Watch game directory for external changes via `chokidar`

## Safety Rules
1. NEVER delete files outside of known directories.
2. ALWAYS create a backup before destructive operations.
3. ALWAYS validate paths before operations (prevent path traversal vulnerabilities).
4. Use `path.resolve()` and check against allowed base directories.
5. Handle `EPERM`, `EACCES` errors gracefully (e.g., file in use by the game).
6. Use atomic writes for config files (write to temp, then rename).

## Backup Strategy
- Before any mod install: snapshot the files that will be modified.
- Store backup in `%APPDATA%/entropic-state/games/[gameId]/backups/[timestamp]/`.
- Backup includes: original files + manifest of what was changed.
- Rollback = restore from the latest backup.
- Keep the last 5 backups per game, auto-clean older ones.

## Criteria for Completion
- `FileSystemService` implemented with all listed operations.
- Security constraints successfully prevent out-of-bound file accesses.
- Backup functionality successfully snapshots and restores state for mod installations.
- Atomic config saves implemented and verified.

## Next Steps
- Implement `FileSystemService` class.
- Add comprehensive unit tests covering all safety rules and boundary conditions.
- Integrate the backup and rollback pipeline with the core install logic.

## Relation to Other Documents
- Provides the fundamental storage capabilities required by the Game System (`08-GAME_SYSTEM.md`).
- Handles data caching for Downloads defined in the IPC specs.
