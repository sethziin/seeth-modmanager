# Package Format

## Objective
Define the expected format of mod packages (archives) that the mod manager can accept and process. This ensures consistency between mod creators and the installation pipeline.

## Responsibility
- Specify accepted archive formats
- Define the internal directory structure of a mod package
- Document the manifest file location and naming convention
- Govern validation rules for package structure

## Scope
Covers the archive format, required directory structure, manifest location, and optional assets. Does not cover the manifest schema itself (see `03-manifest.md`).

## Accepted Archive Formats

| Format | Extension | Support | Notes |
|--------|-----------|---------|-------|
| ZIP | `.zip` | Primary | Most common, wide compatibility |
| 7-Zip | `.7z` | Supported | Better compression, larger mods |
| RAR | `.rar` | Supported | Legacy format, decreasing usage |
| Directory | (none) | Supported | For development and testing, a folder with the same structure |

## Package Structure

A valid mod package must follow one of these structures:

### Standard Structure (with manifest)

```
mod-package.zip
├── mod.json                    # Manifest (required for metadata extraction)
├── files/                      # Files to be installed
│   ├── ScriptHookV.dll
│   ├── NativeUI.asi
│   └── scripts/
│       ├── mymod.asi
│       └── config.ini
├── thumbnails/                 # Optional preview images
│   ├── preview.jpg
│   └── icon.png
└── docs/                       # Optional documentation
    └── README.txt
```

### Flat Structure (no manifest, legacy)

For packages without a manifest, the file list is taken directly from the archive root. All files are treated as `action: 'add'` with `destination` equal to their relative path within the archive.

```
legacy-mod.zip
├── ScriptHookV.dll             # Copied to game root
├── scripts/
│   └── mymod.asi               # Copied to game root/scripts/
└── config.ini                  # Copied to game root
```

## File Naming Constraints

| Constraint | Rule |
|-----------|------|
| Path separator | Forward slash `/` only |
| Maximum path length | 260 characters (Windows MAX_PATH) |
| Character set | UTF-8, no null bytes |
| Directory traversal | Banned — `../` or `..\\` in paths |
| Reserved names | Windows reserved names (CON, PRN, etc.) banned |
| Maximum files per package | 10,000 files |

## Validation

When validating a package, the system checks:

1. **Archive integrity**: Can be opened and read without corruption
2. **No traversal**: All paths must resolve within the package
3. **Manifest presence**: `mod.json` at root (if present, must be valid JSON)
4. **File references**: If manifest exists, all `files[].source` paths must exist in the archive
5. **Thumbnail**: If `thumbnail` specified in manifest, the path must exist

## Packaging for Distribution (Future)

For mod creators who want to distribute through the catalog, the recommended packaging process:

1. Create a `mod.json` manifest (see `03-manifest.md`)
2. Place all files in the `files/` directory matching their game-relative paths
3. Optionally add `thumbnails/` preview images
4. Archive as `.zip` using standard compression (deflate)
5. Optionally compute SHA-256 for integrity verification

## Criteria for Completion
- ArchiveService implemented with support for ZIP, 7z, RAR
- Package structure validation implemented
- Traversal attack prevention
- Manifest discovery within archive
- Legacy flat structure support

## Next Steps
- Determine archive extraction library (adm-zip, extract-zip, or node-stream-zip)
- Implement ArchiveService
- Integrate with Step 6 of installation pipeline

## Relation to Other Documents
- `03-manifest.md` defines the `mod.json` schema
- `05-installation-pipeline.md` consumes this in Steps 2 and 6
- `08-file-layout.md` defines where packages are stored before extraction
