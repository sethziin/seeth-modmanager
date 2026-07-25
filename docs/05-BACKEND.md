# Entropic State - Backend Architecture

## Objective
To define the initialization lifecycle, service contracts, data storage paths, and window configurations of the Entropic State Mod Manager's Main (Node.js) process.

## Responsibility
This document governs the operational logic of the Electron backend. It ensures AI agents understand how services are bootstrapped, how data persists on the host OS, and the contract signatures for core operations.

## Scope
Covers the `src/main/index.ts` entry point, the dependency graph and initialization sequence of the Service Layer, the detailed API contracts for backend services, application data paths, and the `BrowserWindow` configuration.

## Dependencies (on other docs)
- Requires `03-ARCHITECTURE.md` to contextualize the Service Pattern and IPC data flow.
- Requires `04-CODING_STANDARDS.md` to ensure service contracts adhere to naming and error handling conventions.

## Criteria for Completion
Complete when the lifecycle of the Main process, the exact dependency injection order of all services, application storage locations, and window configurations are exhaustively documented.

## Next Steps
- Create the foundational `Result` and `AppError` shared types.
- Implement the `LogService` and `ConfigService` as the base initialization dependencies.
- Scaffold the `BrowserWindow` setup in `main/index.ts`.

## Relation to Other Documents
- **`03-ARCHITECTURE.md`**: Acts as a zoom-in on the "Service Layer" outlined in the macro architecture.
- **`04-CODING_STANDARDS.md`**: Rules from the standards doc apply directly to the TypeScript interfaces defined here.

---

## Main Process Architecture
The main process acts as the backend server for the desktop application. Running in Node.js, it has full, unrestricted access to the underlying Operating System.

**Entry Point**: `src/main/index.ts`
Responsibilities of the entry point:
1. Initialize the Electron `app` lifecycle.
2. Instantiate all backend Services in the correct dependency order.
3. Register IPC handler bridges that map string channels (e.g., `mod:install`) to Service methods.
4. Create and configure the primary `BrowserWindow`.
5. Manage application lifecycle events (`ready`, `window-all-closed`, `activate`).

## Service Initialization Order
Services use constructor-based dependency injection. Because of this, they must be instantiated in a strict, topologically sorted order:

1. **`LogService`**: Initialized first. Required by all subsequent services for error and audit logging.
2. **`ConfigService`**: Loads user preferences and system configuration. Required by most domain services.
3. **`FileSystemService`**: Core utility for disk I/O.
4. **`CacheService`**: Depends on `FileSystemService` and `ConfigService`. Manages local temp files.
5. **`GameService`**: Depends on `ConfigService` and `FileSystemService`. Bootstraps GameProviders.
6. **`BackupService`**: Depends on `FileSystemService` and `ConfigService`.
7. **`ModService`**: Depends on `GameService`, `FileSystemService`, `ConfigService`, `BackupService`, and `LogService`. The core orchestrator.
8. **`DownloadService`**: Depends on `FileSystemService`, `CacheService`, and `ConfigService`.

## Service Details

### ModService
Manages the lifecycle of mods (installation, uninstallation, enabling, disabling).

- **Dependencies**: `GameService`, `FileSystemService`, `ConfigService`, `BackupService`, `LogService`
- **Internal State**: In-memory cache of currently loaded mod registries per game.
- **Error Scenarios**: Mod format invalid, file access denied, game directory not found, backup failure, conflicting mod dependencies.
- **Managed Paths**: Reads/writes to the Mod Registry JSON file. Writes to the target game's mod directory.

```typescript
class ModService {
  constructor(
    private gameService: GameService,
    private fileSystem: FileSystemService,
    private config: ConfigService,
    private backup: BackupService,
    private log: LogService
  ) {}

  /** Installs a mod from an archive into the target game */
  async installMod(gameId: string, modPath: string): Promise<Result<InstalledMod, AppError>>;
  /** Completely removes a mod and deletes its files */
  async uninstallMod(gameId: string, modId: string): Promise<Result<void, AppError>>;
  /** Restores a disabled mod's files to the active game directory */
  async enableMod(gameId: string, modId: string): Promise<Result<void, AppError>>;
  /** Moves a mod's files out of the active game directory into isolated storage */
  async disableMod(gameId: string, modId: string): Promise<Result<void, AppError>>;
  /** Retrieves all installed mods for a specific game */
  async getInstalledMods(gameId: string): Promise<Result<InstalledMod[], AppError>>;
  /** Polls external sources for mod updates */
  async checkForUpdates(gameId: string): Promise<Result<ModUpdate[], AppError>>;
  /** Gets metadata for a specific mod */
  async getModDetails(gameId: string, modId: string): Promise<Result<ModDetails, AppError>>;
}
```

*(Note: Similar signatures will apply to other services like `DownloadService`, `GameService`, and `FileSystemService` based on their domain responsibilities outlined in the Architecture document).*

## Application Data Paths
The backend persists state strictly within the OS-designated `AppData` directory (e.g., `C:\Users\<User>\AppData\Roaming\entropic-state\` on Windows).

- **App Configuration**: `%APPDATA%/entropic-state/config.json`
- **Game Registry**: `%APPDATA%/entropic-state/games.json`
- **Mod Registries**: `%APPDATA%/entropic-state/games/[gameId]/mods.json`
- **Download Cache**: `%APPDATA%/entropic-state/cache/downloads/`
- **Backups**: `%APPDATA%/entropic-state/backups/[gameId]/[timestamp]/`
- **Logs**: `%APPDATA%/entropic-state/logs/`

*Constraint*: The backend must automatically create these directory structures upon initialization if they do not exist.

## Window Configuration
The `BrowserWindow` instance spawned by `main/index.ts` strictly adheres to the "True Dark Desktop" UI aesthetic and Electron security models.

- **Default Size**: `1280x800`
- **Minimum Size**: `1024x600`
- **Frame**: `false` (OS titlebar is disabled; application renders a custom 48px titlebar).
- **Background Color**: `#131315` (Prevents white flashing during initial React load).
- **WebPreferences**:
  - `preload`: Absolute path to the compiled preload script.
  - `contextIsolation`: `true`
  - `nodeIntegration`: `false`
  - `sandbox`: `true`
  - `webSecurity`: `true`
