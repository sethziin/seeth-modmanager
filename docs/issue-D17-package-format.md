# Issue: Package format divergence — `files/` wrapper vs flat structure (D17)

**Repo:** sethziin/seeth-modmanager (private)
**Type:** Bug / Doc divergence
**Priority:** Low
**Labels:** documentation, packaging, v1

## Summary

`docs/07-package-format.md` documents the standard package structure with a
`files/` wrapper directory:

```
mod-package.zip
├── mod.json
└── files/
    ├── ScriptHookV.dll
    └── scripts/
        └── mymod.asi
```

However, the V1 implementation does **not** support the `files/` prefix.
Mods packaged with the `files/` wrapper fail to install.

## Root cause (code-verified)

1. `archive-service.extractAll()` extracts **all** entries preserving
   `entryName` → `files/EntropicLibrary.asi` becomes
   `staging/files/EntropicLibrary.asi`.
2. `manifest-reader.buildModArchive()` filters with
   `availableFiles.includes(f.source)` and sets `relativePath = f.destination`.
3. `mod-installer.install()` copies from `path.join(stagingDir, f.relativePath)`.

If the ZIP uses `files/`:
- `source: "EntropicLibrary.asi"` → fails `includes` (available =
  `"files/EntropicLibrary.asi"`) → `files.length === 0` → error
  *"Mod archive contains no files to install"*.
- Or `source: "files/EntropicLibrary.asi"` passes the filter, but the installer
  looks for `staging/EntropicLibrary.asi` (does not exist) → silent skip,
  nothing installs.

**Conclusion:** the only structure V1 actually installs is **FLAT**
(`mod.json` at root + files at game-relative paths, no `files/` prefix).

## Decision (V1, 2026-07-25)

- Accept FLAT for V1. Do **not** modify the installer now.
- Pending: decide between:
  - **Option 1:** change code (`extractAll` / `buildModArchive`) to accept/strip
    the `files/` prefix.
  - **Option 2:** officialize FLAT as the final format and update
    `07-package-format.md`.

## Action items

- [ ] Decide Option 1 vs Option 2
- [ ] If Option 2: update `docs/07-package-format.md` to describe FLAT as the
      canonical structure (remove `files/` wrapper example)
- [ ] Add a packaging test that builds a FLAT mod and asserts successful install

## References

- `docs/divergence-report.md` → entry **D17**
- `docs/07-package-format.md` (Standard Structure section)
- `src/main/services/archive-service.ts` (`extractAll`)
- `src/main/lib/manifest-reader.ts` (`buildModArchive`)
- `src/main/services/mod-installer.ts` (`install`)
