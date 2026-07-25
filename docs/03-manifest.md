# Mod Manifest

## Objective
Define the mod manifest format — the metadata file embedded inside a mod package that describes its contents, dependencies, and configuration. The manifest is the primary source of metadata when installing mods from local files.

## Responsibility
- Specify the manifest file format and location within a package
- Define all metadata fields and their constraints
- Govern how the system reads, validates, and displays manifest data
- Ensure forward compatibility through schema versioning

## Scope
Covers the manifest schema, file location conventions, field semantics, validation rules, and the relationship between manifest data and the InstalledMod registry entry. Does not cover the catalog format (see `02-catalog.md`) or the packaging format (see `07-package-format.md`).

## Manifest File

**File name**: `mod.json`
**Location**: Root of the mod package directory or archive
**Format**: JSON

### Schema

```typescript
interface ModManifest {
  manifestVersion: number        // Schema version (currently 1)
  id: string                     // Reverse-domain unique ID (e.g., "com.razed.naturalvision")
  name: string                   // Human-readable display name
  version: string                // Version string (prefer semver)
  author: string                 // Creator name
  description?: string           // Short description (max 500 chars)
  
  category: string               // Category ID from game provider (e.g., "graphics")
  tags?: string[]                // Optional searchable tags
  thumbnail?: string             // Relative path to thumbnail image within package
  
  gameId: string                 // Target game (e.g., "gtav")
  minGameVersion?: string        // Minimum game version required
  maxGameVersion?: string        // Maximum game version supported
  verifiedGameVersion?: string   // Game version this was tested against
  
  dependencies?: ModDependency[] // Required and optional dependencies
  conflicts?: string[]           // IDs of mods this conflicts with
  
  files: ModManifestFile[]       // List of files to install
  
  installInstructions?: string   // Optional human-readable install notes
  sourceUrl?: string             // Original download URL
  changelog?: string             // Version changelog text
}
```

### Dependency Entry

```typescript
interface ModDependency {
  id: string                     // Reverse-domain ID of the dependency
  name: string                   // Human-readable name
  version?: string               // Required version (prefer semver range)
  required: boolean              // Whether installation should fail if missing
  downloadUrl?: string           // Where to get it if not installed
  type?: 'mod' | 'tool' | 'library'  // Dependency type
}
```

### File Entry

```typescript
interface ModManifestFile {
  source: string                 // Relative path within the package
  destination: string            // Relative path within the game directory
  action: 'add' | 'replace'     // Whether this file is new or replaces an existing one
  hash?: string                  // SHA-256 of the file
}
```

### Example

```json
{
  "manifestVersion": 1,
  "id": "com.razed.naturalvision",
  "name": "NaturalVision Evolved",
  "version": "2.0.0",
  "author": "Razed",
  "description": "Complete visual overhaul for GTA V",
  "category": "graphics",
  "tags": ["visuals", "enb", "reshade", "hd-textures"],
  "gameId": "gtav",
  "minGameVersion": "1.0.877.1",
  "files": [
    {
      "source": "NaturalVisionEvolved.exe",
      "destination": "NaturalVisionEvolved.exe",
      "action": "replace",
      "hash": "e3b0c44298fc1c149afbf4c8996fb924..."
    },
    {
      "source": "shaders/sun_shader.fx",
      "destination": "mods/shaders/sun_shader.fx",
      "action": "add",
      "hash": "d7a8fbb307d7809469ca9abcb0082e4f..."
    }
  ],
  "dependencies": [
    {
      "id": "com.dev-c.scripthookv",
      "name": "ScriptHookV",
      "required": true,
      "type": "tool"
    }
  ]
}
```

## Validation Rules

The manifest is validated against the following rules during installation:

| Rule | Severity | Description |
|------|----------|-------------|
| `manifestVersion` supported | Error | Schema version is not supported by this version of the manager |
| Required fields present | Error | `id`, `name`, `version`, `author`, `category`, `gameId`, `files` must exist |
| `gameId` matches target | Error | Package targets a different game |
| `dependencies` resolvable | Warning | Required dependencies are not installed |
| `files` list non-empty | Error | Must have at least one file entry |
| `source` paths valid | Warning | Source paths reference files within the package |
| `minGameVersion` satisfied | Warning | Game version is below the minimum required |

## ManifestReader

Reading manifests is handled by the provider's `validateMod` method:

```typescript
class ManifestReader {
  static findAndParse(archivePath: string): Result<ModManifest>
  static validate(manifest: ModManifest, gameId: string, gameVersion: string): Result<ModManifestValidation>
}

interface ModManifestValidation {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
```

## Without a Manifest

If a mod package does not contain a `mod.json`, the system will:
1. Attempt to infer metadata from the archive name and structure
2. Present a manual metadata input dialog to the user
3. Fall back to storing with "Unknown Mod" metadata (current behavior documented for transition)

## Criteria for Completion
- ModManifest schema defined and versioned
- ManifestReader implemented with validation
- Provider.validateMod() parses and returns manifest data
- Fallback behavior for packages without manifest implemented

## Next Steps
- Implement ManifestReader in the shared/types layer
- Update GTAVProvider.validateMod() to parse manifests
- Wire manifest data through the installation pipeline

## Relation to Other Documents
- `07-package-format.md` defines the archive structure that contains the manifest
- `05-installation-pipeline.md` uses manifest data during install
- `04-dependencies.md` uses the dependency entries from manifest
- `09-MOD_SYSTEM.md` maps manifest fields to InstalledMod fields
