# Dependency System

## Objective
Define how mod dependencies are declared, resolved, validated, and managed within the mod manager. This covers both tool/library dependencies (ScriptHookV, OpenIV) and inter-mod dependencies.

## Responsibility
- Define the dependency data model and resolution strategy
- Specify how required tools are detected and validated
- Govern dependency checks during install, uninstall, and enable/disable
- Define the user experience for missing dependencies

## Scope
Covers dependency declaration formats, resolution algorithms, validation during lifecycle operations, and the dependency registry. Does not cover the actual installation of external tools — only detection and validation.

## Dependency Types

```typescript
type DependencyType = 'mod' | 'tool' | 'library'

interface Dependency {
  id: string                     // Unique identifier (reverse-domain)
  name: string                   // Display name
  type: DependencyType           // Category of dependency
  required: boolean              // If true, installation fails when missing
  version?: string               // Required version string
  description?: string           // Human-readable description
  downloadUrl?: string           // Where to obtain the dependency
  detectPath?: string            // Relative path to check for existence
  detectFiles?: string[]         // Files to check for presence validation
}
```

## Game-Level Dependencies

Each game provider declares its required dependencies. These are checked during game validation and mod installation:

### GTA V Dependencies

| ID | Name | Required For | Type | Detection |
|----|------|-------------|------|-----------|
| `com.dev-c.scripthookv` | ScriptHookV | .asi mods | tool | `ScriptHookV.dll` in game root |
| `com.crosire.scripthookvdotnet` | ScriptHookVDotNet | .NET script mods | library | `ScriptHookVDotNet.asi` in game root |
| `com.openiv.openiv` | OpenIV | RPF modifications | tool | Optional — detected if in PATH or install dir |

## Dependency Registry

Stored at `<dataDir>/dependencies.json`:

```json
{
  "version": 1,
  "dependencies": {
    "com.dev-c.scripthookv": {
      "name": "ScriptHookV",
      "type": "tool",
      "installed": true,
      "detectedAt": "2026-07-20T10:30:00Z",
      "detectedVersion": "1.0.2803.0",
      "installPath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grand Theft Auto V\\ScriptHookV.dll"
    }
  }
}
```

## Dependency Resolution

### Installation Check
When installing a mod, the system:
1. Reads the mod's manifest dependencies
2. For each required dependency, checks the dependency registry
3. If missing:
   - **Tool/Required**: Block installation with clear message and download link
   - **Library/Optional**: Show warning but allow installation
4. Auto-detects tool dependencies by scanning game directory for known files

### Uninstall Guard
When uninstalling a mod, the system:
1. Checks if other installed mods depend on this mod
2. If yes: Block uninstall with list of dependent mods
3. If no: Allow uninstall

### Enable/Disable Guard
When disabling a mod, the system:
1. Checks if other enabled mods depend on this mod
2. If yes: Block disable with list of dependent mods
3. If no: Allow disable

## DependencyService

```typescript
class DependencyService {
  registerGameDependencies(gameId: string, deps: Dependency[]): void
  scanForTools(gameId: string, installPath: string): Promise<Result<ScannedDependency[]>>
  checkModDependencies(gameId: string, modDeps: ModDependency[]): Promise<Result<DependencyCheckResult>>
  getDependents(gameId: string, modId: string): Promise<Result<string[]>>
  isSatisfied(dep: ModDependency, installPath: string): Promise<Result<boolean>>
}

interface DependencyCheckResult {
  satisfied: boolean
  missing: ModDependency[]       // Required deps not found
  warnings: ModDependency[]      // Optional deps not found
  suggestions: string[]          // Human-readable resolution steps
}

interface ScannedDependency {
  id: string
  detected: boolean
  version?: string
  path?: string
}
```

## Dependency Validation Rules

| Operation | Required Missing | Optional Missing | Dependents Exist |
|-----------|-----------------|------------------|------------------|
| Install | Block | Warn | N/A |
| Uninstall | N/A | N/A | Block |
| Disable | N/A | N/A | Block |
| Enable | Check & Warn | Check & Warn | N/A |

## Dependency Graph Visualization (Future)

For future versions, a dependency graph visualization will show:
- Which mods depend on which
- Circular dependency detection
- Version conflict resolution

## Criteria for Completion
- Dependency data model defined
- DependencyService with game-level dependency registration
- Tool scanning during game detection
- Dependency checks during install, uninstall, disable operations
- Dependency registry storage

## Next Steps
- Implement DependencyService
- Wire dependency checks into ModService.installMod()
- Wire dependency guards into ModService.uninstallMod() and disableMod()
- Update GTAVProvider to declare game-level dependencies

## Relation to Other Documents
- `03-manifest.md` declares the mod-level dependency format
- `05-installation-pipeline.md` integrates dependency checks into the install flow
- `08-GAME_SYSTEM.md` defines game-level required dependencies
- `09-MOD_SYSTEM.md` uses dependency data in lifecycle operations
