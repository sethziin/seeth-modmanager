# Mod System Architecture

## Objective
To define the architecture and lifecycle for managing mods within the Entropic State Mod Manager, handling discovery, validation, installation, state management, updates, uninstallation, and conflict resolution across supported games.

## Responsibility
The Mod System is responsible for maintaining the integrity of the game installation while applying user-selected modifications. It handles file operations, maintains the registry of installed mods, tracks dependencies and conflicts, and provides rollback capabilities.

## Scope
- Mod lifecycle management (Discovery to Uninstallation)
- Mod data model and registry format
- Conflict detection and resolution strategies
- Enable/Disable mechanisms via staging
- Rollback and backup management

## Mod Lifecycle
1. **Discovery**: User selects a mod archive file OR browses available mods
2. **Validation**: System validates the archive structure against game provider rules
3. **Installation**: Files are extracted and copied to the game directory (with backup)
4. **Registration**: Mod is added to the per-game `mods.json` registry
5. **Enable/Disable**: Mod files are moved between game directory and staging area
6. **Update**: New version replaces old files (with backup of current state)
7. **Uninstallation**: Files are removed, backup optionally restored

## Mod Data Model
```typescript
interface InstalledMod {
  id: string                    // UUID v4
  gameId: string                // Reference to game
  name: string                  // Display name
  version: string               // Semantic version or arbitrary string
  author: string                // Mod author
  description?: string          // Optional description
  category: ModCategory         // Category enum
  enabled: boolean              // Currently active
  installedAt: string           // ISO date
  updatedAt: string             // ISO date
  files: ModFile[]              // List of installed files
  sourcePath?: string           // Original archive path
  sourceUrl?: string            // Download URL if downloaded
  dependencies: string[]        // IDs of required mods
  tags: string[]                // User-defined tags
  verified: boolean             // Version verification status
  verifiedVersion?: string      // Game version this was verified against
  isCoreDependency: boolean     // Cannot be removed (e.g., OpenIV)
  thumbnailPath?: string        // Path to mod thumbnail
}

interface ModFile {
  relativePath: string          // Path relative to game root
  originalHash: string          // SHA-256 of the original game file (if replaced)
  modHash: string               // SHA-256 of the mod file
  action: 'add' | 'replace'    // Whether file was added or replaced
}

interface ModCategory {
  id: string
  name: string
  icon: string                  // Material icon name
  color?: string                // Optional accent color
}
```

## Mod Registry (mods.json)
Stored at `%APPDATA%/entropic-state/games/[gameId]/mods.json`
```json
{
  "version": 1,
  "gameId": "gtav",
  "mods": [
    {
      "id": "uuid-here",
      "name": "NaturalVision Evolved",
      "version": "2.0",
      "author": "Razed",
      "category": "graphics",
      "enabled": true,
      "installedAt": "2026-07-20T10:30:00Z",
      "files": [...]
    }
  ]
}
```

## Conflict Detection
- Two mods conflict if they modify the same file
- When installing a mod, check all existing mod files for overlaps
- Display conflict warning with details of which files conflict
- User can choose to: skip conflicting files, overwrite, or cancel
- Conflict resolution is stored in the mod registry

## Enable/Disable Strategy
- When disabling: move mod files from game directory to staging directory (`%APPDATA%/entropic-state/games/[gameId]/disabled/[modId]/`)
- When enabling: move files back from staging to game directory
- If original game files were replaced: restore from backup when disabling
- Update `mods.json` registry after each operation

## Rollback
- Every installation creates a rollback point (backup)
- User can rollback to any previous state
- Rollback restores original files from backup
- Removes mod files that were added
- Updates registry to match rolled-back state

## Dependencies
- `15-CONFIGURATION.md` (for global mod management settings)
- Game Provider Architecture docs (e.g., GTAVProvider rules)

## Criteria for Completion
- Implementation of the `InstalledMod` and related interfaces.
- `ModService` capable of full lifecycle management (install, enable/disable, uninstall).
- Robust conflict detection system with user prompts.
- Working rollback mechanism.
- Staging and backup systems fully functional.

## Next Steps
- Implement `ModService` to handle core logic.
- Create UI views for Installed Mods and Browse Mods.
- Implement conflict resolution dialogs.
- Write unit tests for rollback and conflict scenarios.

## Relation to Other Documents
This document defines the core domain logic for mods. It interacts closely with the Configuration system (for settings like `createBackupBeforeInstall`) and the Download system (which provides the source archives for installation).
