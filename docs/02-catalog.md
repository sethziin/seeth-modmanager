# Catalog System

## Objective
Define the catalog system for discovering, organizing, and presenting available mods to the user. The catalog is the data layer behind the Browse Mods page and any future remote mod sources.

## Responsibility
- Define the catalog data model and storage format
- Specify how mods are indexed, searched, and filtered
- Define the catalog source interface for future remote backends
- Govern the relationship between catalog entries and installed mods

## Scope
Covers the local catalog format, search/filter operations, catalog provider abstraction, and synchronization between catalog and installed mod registry. Does not cover specific remote API integrations (e.g., Nexus Mods, ModDB) — those are future catalog provider implementations.

## Catalog Data Model

```typescript
interface CatalogEntry {
  id: string                    // Unique catalog ID (reverse domain or UUID)
  name: string                  // Display name
  version: string               // Latest available version
  author: string                // Mod author/creator
  description?: string          // Short description
  category: string              // Category ID matching game provider categories
  tags: string[]                // Searchable tags
  thumbnailUrl?: string         // URL or local path to thumbnail
  sourceUrl: string             // Download URL or local path
  fileSize?: number             // Size in bytes
  checksum?: string             // SHA-256 of the download
  dependencies: string[]        // Required dependency IDs
  gameId: string                // Target game
  verifiedVersion?: string      // Game version this was verified against
  createdAt: string             // ISO date
  updatedAt: string             // ISO date
  rating?: number               // Optional community rating (0-100)
  downloadCount?: number        // Optional download count
}
```

### Catalog Storage Format
Stored at as a local JSON file. Schema:

```json
{
  "version": 1,
  "updatedAt": "2026-07-24T12:00:00Z",
  "source": "local",
  "entries": [
    {
      "id": "com.example.naturalvision",
      "name": "NaturalVision Evolved",
      "version": "2.0.0",
      "author": "Razed",
      "category": "graphics",
      "tags": ["visuals", "enb", "reshade", "hd"],
      "sourceUrl": "/downloads/nve-v2.zip",
      "dependencies": [],
      "gameId": "gtav"
    }
  ]
}
```

## Catalog Provider Interface

To support multiple sources (local file, remote API, bundled defaults), the catalog uses a provider abstraction:

```typescript
interface CatalogProvider {
  readonly id: string
  readonly name: string
  
  search(query: string, filters?: CatalogFilters): Promise<Result<CatalogEntry[]>>
  getEntry(id: string): Promise<Result<CatalogEntry>>
  refresh(): Promise<Result<void>>
}

interface CatalogFilters {
  category?: string
  gameId?: string
  tags?: string[]
  sortBy?: 'name' | 'updatedAt' | 'rating' | 'downloadCount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
```

### Default Providers

1. **LocalCatalogProvider**: Reads from a bundled or downloaded `catalog.json` file. Primary provider for v1. The **only** provider registered in `CatalogService`. Responsible for serving search and entry lookup.

2. **RemoteCatalogProvider**: Fetches `catalog.json` from a remote URL, validates checksum, and writes atomically to the local cache file consumed by `LocalCatalogProvider`. Does **not** implement `CatalogProvider` — it is a standalone sync utility, not a search provider.

## Sync Flow

```
RemoteCatalogProvider (standalone — não registrado no CatalogService)
  │  fetch(REMOTE_URL) com ETag
  │  valida SHA-256 checksum
  │  write atomic → cache/catalogs/catalog.json
  ▼
LocalCatalogProvider (único provider registrado)
  │  refresh() → lê cache/catalogs/catalog.json
  │  search() / getEntry() → opera sobre dados em memória
  │  fallback → FALLBACK_ENTRIES (bundled, sem cache)
  ▼
CatalogService
  │  search() → delega para LocalCatalogProvider
  ▼
BrowseModsPage (UI)
```

### Startup Behavior
- `LocalCatalogProvider.refresh()` é chamado **antes** do sync remoto — o app abre imediatamente com cache local ou fallback
- `RemoteCatalogProvider.sync()` é fire-and-forget no startup — nunca bloqueia o carregamento
- Se o sync remoto encontrar novos dados, `LocalCatalogProvider.refresh()` é chamado novamente para recarregar

### RemoteCatalogProvider

| Característica | Detalhe |
|----------------|---------|
| Arquivo | `src/main/providers/remote-catalog.provider.ts` |
| Registro | Não implementa `CatalogProvider` — não é registrado no `CatalogService` |
| URL | `https://raw.githubusercontent.com/sethziin/seeth-modmanager-catalog/main/catalog.json` |
| Cache | Escreve em `<dataDir>/cache/catalogs/catalog.json` (mesmo arquivo que LocalCatalogProvider lê) |
| ETag | Enviado em requests subsequentes para evitar re-download |
| Checksum | Compara `checksum` do JSON remoto com o cache local — se igual, skip |
| Escrita atômica | `temp + rename` |
| Timeout | 10 segundos |
| Backoff | `syncAttempts` tracking (expõe via `getSyncAttempts()`) |
| Falha | Silenciosa — nunca bloqueia o app |

## CatalogService

The `CatalogService` manages the registry of catalog providers and routes queries:

```typescript
class CatalogService {
  registerProvider(provider: CatalogProvider): void
  searchAll(query: string, filters?: CatalogFilters): Promise<Result<CatalogEntry[]>>
  searchProvider(providerId: string, query: string, filters?: CatalogFilters): Promise<Result<CatalogEntry[]>>
  getEntry(providerId: string, entryId: string): Promise<Result<CatalogEntry>>
  refreshAll(): Promise<Result<void>>
  refreshProvider(providerId: string): Promise<Result<void>>
}
```

## Search Index
The local catalog maintains a simple in-memory inverted index on:
- `name` (substring match, case-insensitive)
- `author` (substring match)
- `tags` (exact match, any tag)
- `category` (exact match)
- `description` (substring match)

## Relationship to Installed Mods

A catalog entry becomes an installed mod when the user installs it. The link is maintained via `sourceUrl` in `InstalledMod`:

```
CatalogEntry.id  ───  InstalledMod.sourceUrl (when installed from catalog)
                     InstalledMod.sourcePath (when installed from local file)
```

The user can also install from a local file (drag-and-drop or file picker) without a catalog entry. In this case, metadata is either extracted from the package manifest or entered manually.

## Criteria for Completion
- Catalog data model and storage format defined
- CatalogProvider interface specified
- LocalCatalogProvider capable of reading and searching a catalog
- CatalogService routes queries to registered providers
- Search and filter operations functional

## Next Steps
- Implement LocalCatalogProvider
- Implement CatalogService
- Wire CatalogService to IPC handlers
- Connect to BrowseModsPage UI

## Relation to Other Documents
- `03-manifest.md` defines the per-mod metadata format (used when parsing local packages not from catalog)
- `09-MOD_SYSTEM.md` defines how catalog entries become installed mods
- `10-DOWNLOAD_SYSTEM.md` handles the actual file download for catalog entries with remote sourceUrl
- `08-GAME_SYSTEM.md` provides the category system used by catalog entries
