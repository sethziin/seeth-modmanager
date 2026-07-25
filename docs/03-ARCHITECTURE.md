# Entropic State - System Architecture

## Objective
To define the structural organization, process model, and architectural patterns of the Entropic State Mod Manager, ensuring AI agents can systematically implement, refactor, and scale the application.

## Responsibility
This document governs the macro-level design decisions of the application. It dictates how the Main (Node.js) and Renderer (Chromium) processes communicate, how game support is abstracted, and how state flows through the system.

## Scope
Covers the Electron process model, IPC communication bridges, backend Service and Provider patterns, frontend Store and Feature patterns, data flow lifecycle, error handling strategies, and application security model.

## Dependencies (on other docs)
- Requires `01-PRODUCT_REQUIREMENTS.md` (implicit) for context on application features.
- Requires `02-UI_UX_DESIGN.md` (implicit) for context on UI constraints.

## Criteria for Completion
This document is considered complete when all architectural patterns (Process Model, Data Flow, Providers, Services, Error Handling, Security) are strictly defined and unambiguous for AI agent consumption.

## Next Steps
- Implement the `contextBridge` preload script based on the security model.
- Scaffold the `GameProvider` interface and the initial `GTAVProvider`.
- Set up the Zustand store architecture on the frontend.

## Relation to Other Documents
- **`04-CODING_STANDARDS.md`**: Provides the micro-level implementation rules for the patterns defined here.
- **`05-BACKEND.md`**: Expands specifically on the Service layer and Main process initialization mentioned in this document.

---

## Process Model
The application utilizes Electron's multi-process architecture to separate system-level operations from UI rendering.

- **Main Process (Node.js)**: Responsible for OS-level interactions, including the file system, network downloads, game detection, mod installation, and configuration management. This process acts as the backend server.
- **Renderer Process (Chromium)**: Responsible solely for UI rendering, capturing user interactions, and local state management. It operates similarly to a standard web application.
- **Preload Script**: Acts as a secure, typed bridge between the Main and Renderer processes. It exposes a strictly typed API (`window.electronAPI`) from the Main process to the Renderer via Electron's `contextBridge`.

## Architecture Patterns

### Provider Pattern (Game Abstraction)
To support multiple games, game-specific logic is abstracted behind a **Provider Pattern**. The system defines an abstract `GameProvider` interface. Concrete implementations (e.g., `GTAVProvider`) encapsulate the proprietary logic for detecting, validating, and installing mods for a specific game. This ensures the core `ModService` remains game-agnostic.

### Service Pattern (Backend Domains)
The Main process is organized using a **Service Pattern**. Each discrete domain of functionality (e.g., File System, Downloads, Mods, Logging) is encapsulated within a dedicated Service class. Services can be injected into or instantiated with dependencies on other services.

### Store Pattern (Frontend State)
The Renderer process manages global state using the **Store Pattern** via Zustand. Stores are segregated by feature domain (e.g., `useModStore`, `useGameStore`). Stores handle optimistic updates and asynchronous calls to the Preload API.

### Feature-Based Organization (Frontend Modules)
Frontend code is organized by feature rather than type. A feature directory (e.g., `src/renderer/features/mods`) contains all related components, hooks, stores, and types, ensuring high cohesion and low coupling.

## Data Flow
The application follows a unidirectional data flow for state updates and side effects:
1. **Interaction**: User interacts with the React UI.
2. **Action**: React component dispatches an action to a Zustand store.
3. **Preload API**: The store calls the exposed preload API (e.g., `window.electronAPI.installMod`).
4. **IPC Bridge**: The Preload script bridges this call to an IPC channel (e.g., `ipcRenderer.invoke('mod:install')`).
5. **IPC Handler**: The Main process IPC handler intercepts the request on the specific channel.
6. **Service Delegation**: The handler delegates the operation to the appropriate backend Service (e.g., `ModService`).
7. **Execution**: The Service performs the operation (file system I/O, network requests).
8. **Response**: The Service returns a `Result` object, which flows back through the IPC channel to the Preload script, then to the store.
9. **Render**: The store updates its state based on the result, triggering React to re-render the UI.

## Dependency Direction
To prevent circular dependencies and architectural violations, agents must enforce the following dependency directions:
- **Main Process**: Services → Providers → IPC Handlers. (Handlers depend on Services, Services depend on Providers).
- **Renderer Process**: Components → Hooks → Stores → Preload API.
- **Shared**: Shared types (`src/shared/types`) flow into both `main/` and `renderer/`.
- **CRITICAL**: *Never* import Main process code inside the Renderer process, and *never* import Renderer process code inside the Main process.

## Provider System (Detailed)
The Provider system defines how the Mod Manager interacts with specific games. 

### `GameProvider` (Interface)
```typescript
interface GameProvider {
  id: string;
  name: string;
  detectInstallation(): Promise<GameInstallation | null>;
  getModDirectory(): string;
  validateMod(path: string): Promise<ModValidation>;
  installMod(mod: ModFile, targetDir: string): Promise<InstallResult>;
  uninstallMod(mod: InstalledMod): Promise<void>;
  getGameVersion(): Promise<string>;
  getRequiredDependencies(): Dependency[];
  getModCategories(): ModCategory[];
}
```

### `GTAVProvider` (Implementation)
Implements `GameProvider` for Grand Theft Auto V.
- **Detection**: Checks Steam, Epic Games, and Rockstar Games registry keys for installation paths.
- **Dependencies**: Validates the presence of `ScriptHookV` and `dinput8.dll`.
- **Categories**: Maps mods to: Graphics, Gameplay, Tools, Scripts, Vehicles.
- **Structure**: Understands the GTA V file system hierarchy (`scripts/`, `mods/`, `update/`).
- **Validation**: Inspects `.asi`, `.dll`, and `.rpf` files for compatibility and validity.

## Service Layer (Detailed)
The backend logic is modularized into the following Services:

- **ConfigService**: Reads and writes JSON configuration files. Uses Zod schemas to validate config integrity and provides fallback defaults.
- **FileSystemService**: Wraps native `fs` and `fs-extra` operations. Handles copying, moving, deleting, directory watching, archive extraction, and path normalization.
- **GameService**: Manages the registry of `GameProviders`. Delegates game-specific requests from the frontend to the correct provider based on the active `gameId`.
- **ModService**: Orchestrates the installation, uninstallation, enabling, and disabling of mods. Manages the JSON mod registry and resolves mod conflicts.
- **DownloadService**: Manages HTTP mod downloads. Handles progress tracking, queue management, resume support, and checksum verification of downloaded artifacts.
- **LogService**: Provides structured logging to both file and console. Manages log rotation and log levels (info, warn, error, debug).
- **BackupService**: Creates snapshots/backups of game files prior to mod installation, managing rollback points for disaster recovery.
- **CacheService**: Manages the local cache for downloaded archives, enforcing cleanup policies and tracking disk usage.

## Error Handling Strategy
- **Result Pattern**: All services must return a `Result<T, AppError>` union type rather than throwing exceptions. This forces callers to handle failure cases explicitly.
- **AppError Structure**: Contains `code` (string enum), `message` (human-readable), `context` (metadata object), and `recoverable` (boolean flag).
- **Frontend Surfacing**: The Renderer process evaluates `Result.error` and surfaces it via a centralized notification system.
- **Logging**: All errors generated in the Service layer are automatically logged by the `LogService` before being returned to the caller.

## Security Model
To maintain a secure desktop environment, the application strictly adheres to Electron security best practices:
- `contextIsolation: true`: Ensures the Renderer's JavaScript context is isolated from the Preload script's context.
- `nodeIntegration: false`: Completely disables Node.js APIs in the Renderer process.
- `sandbox: true`: Enables the Chromium OS-level sandbox for the Renderer process.
- **IPC Whitelisting**: Only explicitly defined IPC channels are exposed via the `contextBridge`.
- **Path Restriction**: File operations are restricted to known directories (Game folders, AppData, Cache) to prevent arbitrary file system access.
