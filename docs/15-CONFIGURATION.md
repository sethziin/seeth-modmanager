# Configuration System Architecture

## Objective
To establish a robust, schema-validated configuration management system that handles global application settings and per-game registries for Entropic State.

## Responsibility
The Configuration System is responsible for reading, writing, validating, migrating, and providing access to JSON-based configuration files stored in the user's application data directory.

## Scope
- Configuration architecture and file structures
- Zod schema validation
- IPC access patterns between Main and Renderer processes
- Default values and fallback mechanisms

## Configuration Architecture
All configuration uses JSON files stored in the app data directory. The `ConfigService` manages reading, writing, and validating all configuration.

## Configuration Files

**config.json** - Global application settings:
```json
{
  "version": 1,
  "general": {
    "language": "en",
    "autoCheckUpdates": true,
    "updateCheckInterval": 86400000,
    "startMinimized": false,
    "minimizeToTray": true,
    "theme": "dark"
  },
  "downloads": {
    "maxConcurrent": 3,
    "downloadPath": "%APPDATA%/entropic-state/cache/downloads",
    "autoInstallAfterDownload": false,
    "maxRetries": 3,
    "retryDelay": 5000
  },
  "modManagement": {
    "createBackupBeforeInstall": true,
    "maxBackupsPerGame": 5,
    "showConflictWarnings": true,
    "autoEnableAfterInstall": true
  },
  "cache": {
    "maxSizeMB": 5000,
    "autoCleanupDays": 30
  },
  "logging": {
    "level": "info",
    "maxFileSizeMB": 10,
    "maxFiles": 3
  },
  "window": {
    "width": 1280,
    "height": 800,
    "x": null,
    "y": null,
    "maximized": false
  }
}
```

**games.json** - Game registry:
```json
{
  "version": 1,
  "games": {
    "gtav": {
      "name": "Grand Theft Auto V",
      "installPath": "C:\\Program Files\\Steam\\steamapps\\common\\Grand Theft Auto V",
      "platform": "steam",
      "detectedAt": "2026-07-20T10:00:00Z",
      "lastPlayed": "2026-07-24T15:00:00Z",
      "gameVersion": "v1.0.3028.0",
      "configured": true
    }
  }
}
```

## Schema Validation
- All config files have zod schemas
- Validate on read and write
- If validation fails on read: reset to defaults and log warning
- If validation fails on write: reject the operation
- Migration system: if config version is older, migrate to current version

## Config Access Pattern
- Main process: `ConfigService` reads/writes directly
- Renderer: requests config via IPC, receives copy
- When renderer updates config: sends via IPC, main process validates and saves
- Config changes emit events so all listeners can react

## Default Values
- Every config key has a default value defined in code
- If a key is missing from the file, use the default
- If the entire file is missing, create it with all defaults

## Dependencies
- None directly, but acts as a dependency for almost all other systems.

## Criteria for Completion
- `ConfigService` fully operational with read/write capability.
- Zod schemas strictly defined for `config.json` and `games.json`.
- IPC bridges implemented for seamless Renderer access.
- Migration logic skeleton in place for future version bumps.

## Next Steps
- Define Zod schemas in code.
- Implement `ConfigService` with caching to prevent excessive disk reads.
- Hook up UI Settings page to the configuration IPC events.

## Relation to Other Documents
Serves as the central truth for configurable parameters used by the Download System (`10-DOWNLOAD_SYSTEM.md`), Mod System (`09-MOD_SYSTEM.md`), and general UI presentation.
