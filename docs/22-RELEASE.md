# Build and Release Process

## Objective
Standardize the build, package, and distribution pipeline for the Entropic State Mod Manager.

## Responsibility
Provide a consistent methodology for preparing application releases, managing version numbers, and structuring development workflows using Electron Forge and Vite.

## Scope
Covers build commands, configuration files, environment variables, pre-release checks, versioning logic, and output distribution formats.

## Dependencies
- `01-OVERVIEW.md` (Project ecosystem overview)

## Build System
Electron Forge with Vite plugin handles building and packaging.

## Build Commands
```bash
pnpm dev          # Start development mode with hot reload
pnpm build        # Build for production
pnpm package      # Package into executable
pnpm make         # Create distributable (installer)
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
pnpm test         # Run tests
```

## Build Configuration
- `forge.config.ts`: Electron Forge configuration
- `vite.main.config.ts`: Vite config for main process
- `vite.preload.config.ts`: Vite config for preload script
- `vite.renderer.config.ts`: Vite config for renderer process

## Distribution Format
- **Windows**: NSIS installer (`.exe`) or Squirrel auto-updater
- Initially: just produce a portable `.exe` or unpacked directory
- Future: proper installer with auto-update

## Version Management
- Follow semver (major.minor.patch)
- Version stored in `package.json`
- Accessible via `app.getVersion()` in main process
- Displayed in UI: sidebar, titlebar, statusbar

## Development Workflow
1. `pnpm dev` starts Electron in development mode
2. Vite provides HMR for renderer process
3. Main process restarts on changes
4. Preload script rebuilds automatically

## Pre-release Checklist
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] ESLint has no errors
- [ ] Manual testing of core flows (install mod, remove mod, detect game)
- [ ] Version bumped in `package.json`
- [ ] `CURRENT_TASK.md` is up to date
- [ ] `DECISIONS.md` has any new decisions logged

## Environment Variables
- `NODE_ENV`: 'development' | 'production'
- No other env vars needed (all config is in JSON files)

## Criteria for Completion
- Build and make commands complete successfully on Windows.
- Pre-release checklist can be fulfilled.
- App version correctly populates UI elements during production build.

## Next Steps
- Verify Vite configs for main, preload, and renderer scripts.
- Ensure `forge.config.ts` produces correctly packaged Windows binaries.
- Define initial auto-update strategy (if applicable later).

## Relation to Other Documents
- Orchestrates the compilation and packaging of everything detailed in `02-ARCHITECTURE.md`.
