# Game System Architecture

## Objective
To define a scalable, provider-based architecture that manages multiple games seamlessly within Entropic State, starting with comprehensive support for Grand Theft Auto V (GTA V).

## Responsibility
- Define the `GameProvider` interface that encapsulates all game-specific logic.
- Implement the `GTAVProvider` as the reference implementation.
- Manage the `GameService` registry to route actions to the appropriate provider.
- Handle game detection, validation, mod categorizations, and installation routines uniquely per game.

## Scope
This document outlines the provider interface, specific implementations for GTA V (detection, validation, dependencies), the service registry, and guidelines for adding new games in the future.

## Dependencies
- [06-IPC.md](06-IPC.md) - For game and mod operations exposed to the frontend.
- [07-FILE_SYSTEM.md](07-FILE_SYSTEM.md) - For safe mod installation, backup, and validation logic utilized by providers.

## GameProvider Interface
Every supported game implements the `GameProvider` interface. This is the core abstraction that allows multi-game support.

```typescript
interface GameProvider {
  readonly id: string                    // Unique game identifier (e.g., 'gtav')
  readonly name: string                  // Display name (e.g., 'Grand Theft Auto V')
  readonly shortName: string             // Short name (e.g., 'GTA V')
  readonly slug: string                  // URL-safe slug (e.g., 'gtav')
  readonly supportedPlatforms: Platform[] // e.g., ['steam', 'epic', 'rockstar']
  
  detectInstallation(): Promise<GameInstallation | null>
  validateInstallation(path: string): Promise<ValidationResult>
  getGameVersion(installPath: string): Promise<string>
  getModDirectory(installPath: string): string
  getModCategories(): ModCategory[]
  getRequiredDependencies(): GameDependency[]
  installMod(mod: ModArchive, installPath: string): Promise<ModInstallResult>
  uninstallMod(mod: InstalledMod, installPath: string): Promise<void>
  validateMod(archivePath: string): Promise<ModValidation>
}
```

## GTAVProvider Implementation
Specific details for the GTA V provider:

### Detection Strategy
1. Check Steam registry: `HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Rockstar Games\Grand Theft Auto V`
2. Check Steam library folders for appid `271590`
3. Check Epic Games manifests
4. Check Rockstar Games Launcher registry
5. Allow manual directory selection as fallback

### Validation
- Check for `GTA5.exe` existence
- Check for `GTAVLauncher.exe`
- Verify file signatures/sizes if possible

### Mod Categories
- Graphics (visual mods, ENB, ReShade, texture packs)
- Gameplay (mechanics, AI, physics mods)
- Vehicles (car replacements, additions)
- Characters (player models, skins)
- Maps (map additions, terrain mods)
- Scripts (ASI plugins, .NET scripts)
- Tools (OpenIV, ScriptHookV, etc.)
- Audio (sound replacements)
- UI (HUD mods, menu mods)

### Dependencies
- ScriptHookV (required for `.asi` mods)
- ScriptHookVDotNet (required for `.NET` script mods)
- OpenIV (required for RPF modifications)

### Install Types
- Simple file copy (`scripts/`, root directory)
- OpenIV package installation (`mods/` directory with RPF modification)
- Replace file (backup original, copy new)

## GameService
The `GameService` acts as the registry and router for all game providers:
```typescript
class GameService {
  private providers: Map<string, GameProvider>
  
  registerProvider(provider: GameProvider): void
  getProvider(gameId: string): GameProvider | undefined
  getAllProviders(): GameProvider[]
  detectAllGames(): Promise<DetectedGame[]>
  getGameDetails(gameId: string): Promise<GameDetails>
}
```

## Adding a New Game
To add support for a new game:
1. Create a new file: `src/main/providers/[game-id].provider.ts`
2. Implement the `GameProvider` interface
3. Register the provider in `src/main/providers/index.ts`
4. Add game-specific types to `src/shared/types/games/[game-id].types.ts`
5. No other files need to be modified

This is the key architectural benefit - adding a new game is a self-contained operation.

## Criteria for Completion
- Core `GameProvider` interface and `GameService` are implemented.
- `GTAVProvider` is fully operational for detection, validation, and mod management.
- Provider abstraction isolates game-specific complexities away from generic UI.

## Next Steps
- Write the foundational `GameProvider` interface.
- Implement the `GameService` to support dynamic registration.
- Begin `GTAVProvider` development with the detection and validation phases.

## Relation to Other Documents
- The core engine running behind the IPC commands documented in `06-IPC.md`.
- Acts as a consumer of the safe file manipulation patterns in `07-FILE_SYSTEM.md`.
