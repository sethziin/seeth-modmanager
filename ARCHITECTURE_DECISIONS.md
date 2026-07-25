# Architecture Decisions

## Objective
Document the high-level architecture decisions that govern the structure, patterns, and evolution of the Entropic State Mod Manager. This file defines the architectural invariants — decisions that cannot be changed without significant cross-cutting impact.

## Responsibility
- Record architectural invariants and their rationale
- Define the boundaries of each architectural layer
- Guide implementation and review decisions

## Scope
Covers high-level structural decisions about process model, data flow, extensibility, and security boundaries. Does not cover specific technology choices (see `docs/20-DECISIONS.md` for ADRs).

---

## Decision 1: Pull-Only Architecture

**Status**: Invariant

The application is pull-only — it never initiates external connections without explicit user action. All network requests are in response to a user gesture (searching the catalog, clicking install, checking for updates). There is no background polling, no telemetry, no automatic update checks.

**Rationale**: The application manages local game installations. Background network activity would violate user trust and create unexpected behavior. This also simplifies the security model.

**Implications**:
- DownloadService only operates when called by user action
- Catalog updates require explicit user initiation
- No auto-update mechanism for mods (user must check manually)
- No telemetry or usage reporting

---

## Decision 2: No Server Backend

**Status**: Invariant

All operations are local. There is no server component, no database, and no authentication system. The application is entirely self-contained on the user's machine.

**Rationale**: The target audience is a small group of friends (5-10 users). A server adds deployment, maintenance, and security complexity that is not justified. All data is stored as JSON files.

**Implications**:
- JSON files for all persistent data
- Configuration changes are local only (no sync between users)
- No user accounts or permissions system
- Mod sharing is manual (file copy)

---

## Decision 3: Provider Pattern for Game Abstraction

**Status**: Invariant

All game-specific logic is encapsulated behind the `GameProvider` interface. The core services (`ModService`, `GameService`) are game-agnostic and delegate to providers for game-specific operations.

**Rationale**: This is the key extensibility mechanism. Adding a new game requires only a new provider implementation and registration — no changes to existing services.

**Implications**:
- `GameProvider` interface must be stable (changes affect all providers)
- Each provider is self-contained (detection, validation, install, categories)
- Providers cannot depend on each other
- Provider registration is explicit (no auto-discovery)

---

## Decision 4: Result Pattern for Error Handling

**Status**: Invariant

Every service method returns `Result<T, AppError>` instead of throwing exceptions. This makes error handling explicit in type signatures and forces callers to handle failure cases.

**Rationale**: Exceptions are invisible in function signatures and easy to forget. The Result pattern makes error paths explicit in the type system and enables pattern matching on success/failure.

**Implications**:
- All IPC handlers check `result.success` and map to appropriate HTTP-style responses
- All store actions handle both success and error cases
- `AppError` is a discriminated union with code, message, context, recoverable flag
- No unhandled exceptions in service methods

---

## Decision 5: Atomic File Writes

**Status**: Invariant

All JSON file writes are atomic — write to a temporary file, then rename to the target path. This prevents data corruption from crashes during write operations.

**Rationale**: JSON files are the database. A crash during a non-atomic write results in a truncated or corrupted file, losing data.

**Implications**:
- `ConfigService` uses `.tmp` + `renameSync` for all writes
- Read operations never see partially-written files
- Backup files are also written atomically

---

## Decision 6: Enable/Disable via Staging

**Status**: Design Decision

Mods are enabled and disabled by moving files between the game directory and a staging area (`<dataDir>/games/<gameId>/disabled/<modId>/`). When disabling, files are moved to the staging area. When enabling, they are moved back.

**Rationale**: Simple, reversible, works on all filesystems. Alternatives like symlinks require admin privileges or filesystem support. File renaming/moving is atomic and fast.

**Implications**:
- When a mod that replaced files is disabled, original files are restored from backup
- The disabled/ directory maintains a manifest mapping original locations
- Enable/Disable is a file operation, not just a registry flag
- Enabling a mod re-applies file changes, replacing any files that were modified in the meantime

---

## Decision 7: No Lifecycle Scripts

**Status**: Invariant

Mods cannot include executable scripts that run during install, enable, disable, or uninstall. The mod manager only copies files — it never executes arbitrary code from mod packages.

**Rationale**: Security. Allowing arbitrary code execution from mod packages would create a massive attack surface. Mods distribute binary files (.asi, .dll) that the game itself loads, but the mod manager should not execute them.

**Implications**:
- No pre/post-install scripts
- No custom installers packaged with mods
- No "uninstall scripts" — file removal is always based on the manifest file list
- Mods that require custom installation steps must be installed manually

---

## Decision 8: One Mod Registry Per Game

**Status**: Invariant

Each game has its own `mods.json` file at `<dataDir>/games/<gameId>/mods.json`. There is no global mod registry.

**Rationale**: Mod files are relative to the game directory. A global registry would require each entry to specify which game it belongs to, adding complexity to every query.

**Implications**:
- Operations always require `gameId`
- Switching games means switching registries
- Cross-game mods (same files for multiple games) are not supported in v1

---

## Decision 9: Mod Identity via UUID

**Status**: Invariant

Every installed mod is identified by a UUID v4, generated at installation time. The catalog `id` and manifest `id` are stored as metadata but are not used as the primary key in the mod registry.

**Rationale**: UUIDs are globally unique and can be generated without coordination. Catalog IDs may change if the catalog provider changes. A UUID ensures stable references for enable/disable, uninstall, and dependency tracking.

**Implications**:
- The mod registry uses `id` (UUID) as primary key
- Catalog/manifest `id` is stored in the registry for reference but not used as identity
- Dependency references in manifests use catalog IDs, which are resolved to installed UUIDs at install time
- Mod reinstallation generates a new UUID

---

## Decision 10: registryVersion is Integer

**Status**: Invariant (per ADE-019)

The `version` field in registry files (`mods.json`, `games.json`, `config.json`, `catalog.json`) is an integer, not a semver string. It represents the schema version of the file format.

**Rationale**: Registry files are internal data formats, not distributed packages. Schema changes are backward-incompatible (a new version of the app reads/writes a new format). An integer version is simpler to compare and prevents confusion with semver.

**Implications**:
- `config.json` version starts at 1
- `mods.json` version starts at 1
- `games.json` version starts at 1
- Version bumps require migration logic
- Future schema changes increment the version integer

---

## Decision 11: Catalog Metadata is Separate from Manifest

**Status**: Design Decision

The catalog entry (`CatalogEntry`) and the package manifest (`ModManifest`) are separate schemas. The catalog is for discovery and display; the manifest is for installation metadata.

**Rationale**: A catalog entry may have fields that don't belong in a package manifest (ratings, download counts, screenshots). Conversely, a manifest has installation-specific fields (file list, hashes) that don't belong in a catalog entry.

**Implications**:
- Catalog and manifest share common fields (name, version, author) but have different schemas
- During installation from catalog, the manifest is read from the downloaded package
- During installation from local file, only the manifest is used
- Changes to one schema do not automatically affect the other

---

## Decision 12: Development vs Production Separation

**Status**: Invariant

Development and production configurations are strictly separated. The application detects whether it is running in development mode (via `electron-forge start`) or production mode (packaged executable).

**Rationale**: Prevents accidental data corruption between environments. During development, test data should not mix with the user's real game data.

**Implications**:
- Development mode uses a separate data directory (`%APPDATA%/entropic-state-dev/`)
- Production mode uses `%APPDATA%/entropic-state/`
- The app detects dev mode via `app.isPackaged`
- Log level defaults to `debug` in dev, `info` in production
- Dev mode enables additional debugging features

---

## Decision Log Maintenance

This file documents architectural invariants. Specific technology decisions and their alternatives are recorded in `docs/20-DECISIONS.md` (ADR Log).

**Adding new decisions**: Append to this file with a new numbered entry, date, and rationale. Significant changes to existing decisions must be documented as overrides with justification.

**Review cadence**: Revisit all decisions at each major version bump (x.0.0) to verify they remain valid.
