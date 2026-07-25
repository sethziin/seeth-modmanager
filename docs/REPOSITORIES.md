# Repository Architecture

This document describes the two GitHub repositories that compose the Seeth Mod Manager ecosystem and how they interact.

## Repositories

### App Repository — `seeth-modmanager`

| Field | Value |
|-------|-------|
| URL | `https://github.com/sethziin/seeth-modmanager` |
| Remote | `origin` |
| Branch | `main` |
| Purpose | Electron desktop application (main + renderer) |

Contains:
- Electron main process (12 backend services, 9 IPC handlers, 1 game provider)
- React 19 renderer (7 feature pages, 12 shared components, 5 Zustand stores)
- Preload script (typed contextBridge API)
- Shared types, schemas, and constants
- Architecture documentation (23 docs)
- Build configuration (Electron Forge + Vite)

### Catalog Repository — `seeth-modmanager-catalog`

| Field | Value |
|-------|-------|
| URL | `https://github.com/sethziin/seeth-modmanager-catalog` |
| Remote | `origin` |
| Branch | `main` |
| Purpose | Mod catalog metadata for discovery |

Contains:
- `catalog.json` — Main catalog file (mod entries, versions, checksums)
- `catalog.schema.json` — JSON Schema for validation
- `dependencies.json` — Declared tool/library dependencies
- `mods/` — Reference manifests and mod documentation
- `PUBLISHING.md` — Publishing guide for mod authors

## Communication Flow

```
seeth-modmanager-catalog (GitHub)
│
│  catalog.json (raw URL)
│  https://raw.githubusercontent.com/sethziin/seeth-modmanager-catalog/main/catalog.json
│
▼
seeth-modmanager (App)
│
│  CatalogService
│  ├── LocalCatalogProvider (reads catalog.json from cache)
│  ├── search() / getEntry()
│  └── fallback to bundled DEFAULT_ENTRIES
│
▼
App Cache
│
│  <dataDir>/cache/catalogs/local/catalog.json
│  (local copy of remote catalog, refreshed on demand)
│
▼
BrowseModsPage (UI)
│
│  Search bar / Category filters / Mod cards
│  Download button → opens external sourceUrl
│
▼
User
│
│  Downloads .smp file manually
│  Drags onto app window → ModInstaller pipeline
│
▼
Game Directory
```

## Sync Flow (Future)

1. User opens BrowseModsPage
2. App calls `CatalogService.refreshProvider('local')`
3. `LocalCatalogProvider` fetches `catalog.json` from remote URL
4. Validates SHA-256 checksum against cached version
5. If changed: downloads new catalog, validates against schema, replaces cache
6. If unchanged: uses cached version (offline)
7. If unreachable: falls back to existing cache or bundled defaults
8. User sees updated mod list

## Responsibilities

| Repo | Responsible For | Not Responsible For |
|------|----------------|---------------------|
| `seeth-modmanager` | Running the app, installing mods, managing game files, UI | Storing mod files, hosting downloads, authentication |
| `seeth-modmanager-catalog` | Providing mod metadata, declaring dependencies, hosting reference manifests | Distributing mod files, running backend services, user accounts |

## Design Rules

- **Pull-Only**: The app never pushes data to the catalog. All communication is pull (fetch catalog, download mods).
- **No Authentication**: Neither repo requires authentication to read. The catalog is public.
- **Offline First**: The app works without network. Catalog refresh is optional.
- **Checksum Integrity**: All catalog entries include SHA-256 checksums for package verification.
- **No Lifecycle Scripts**: Mod packages never execute code during install. Only file copy.
