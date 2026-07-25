# 20-DECISIONS

## Objective
Maintain a permanent Architectural Decision Record (ADR) log for the Entropic State Mod Manager.

## Responsibility
Document why critical technical and architectural choices were made. This prevents redundant evaluations, guides AI agents on constraints, and preserves context.

## Scope
Covers all foundational choices including framework selections, state management, configuration formats, UI/UX styling approaches, and structural design patterns.

## Dependencies
- Affects the entire project architecture; implicitly referenced by all implementation documentation.

## Criteria for Completion
- Every significant architectural or tooling choice is documented as an ADR.
- Each ADR includes justification, alternatives evaluated, and project impact.

## Next Steps
- AI agents must consult this document before introducing new tools, dependencies, or large-scale patterns.
- Append new ADRs as the project evolves.

## Relation to Other Documents
Sets the technical boundaries for `18-ROADMAP.md` and establishes the patterns to be implemented in the codebase.

---

## Architectural Decision Log

### ADR-001: Electron as Desktop Framework
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use Electron 33+ as the desktop framework
- **Reason**: Most mature option for web-tech desktop apps. Battle-tested by VS Code, Discord, Slack. Excellent documentation and community. Best TypeScript support.
- **Alternatives Evaluated**:
  - Tauri: Promising but requires Rust knowledge for backend. Less mature ecosystem. Smaller community.
  - NW.js: Less maintained, smaller community, fewer features.
  - Neutralinojs: Too limited for complex file system operations.
- **Impact**: Determines the entire project architecture (main process + renderer process + IPC)

### ADR-002: React 19 as Frontend Framework
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use React 19 for the renderer process UI
- **Reason**: Largest ecosystem, best AI agent training data coverage, excellent TypeScript support, mature tooling
- **Alternatives Evaluated**:
  - Vue 3: Good option but smaller ecosystem, fewer AI agents trained on it
  - Svelte: Great DX but less mature for desktop apps, smaller community
  - Solid.js: Too new, limited ecosystem
- **Impact**: Frontend architecture, component patterns, state management choices

### ADR-003: Zustand for State Management
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use Zustand for global state management
- **Reason**: Minimal boilerplate, TypeScript-first, no provider wrapping needed, simple API perfect for medium-scale apps
- **Alternatives Evaluated**:
  - Redux Toolkit: Too much boilerplate for this project size
  - Jotai: Too atomic, harder to manage complex state
  - MobX: More complex, observables add mental overhead
- **Impact**: How data flows through the frontend, store file organization

### ADR-004: Vanilla CSS with Custom Properties (No Tailwind)
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use plain CSS with CSS custom properties and CSS modules
- **Reason**: The design system is highly specific (True Dark Desktop). No UI library or utility framework matches it. Custom CSS gives full control. CSS modules provide scoping. CSS custom properties enable theming.
- **Alternatives Evaluated**:
  - Tailwind CSS: Would require extensive customization to match the design system, adds build complexity, utility classes make code verbose
  - CSS-in-JS (styled-components): Runtime overhead, less familiar to AI agents, more complex tooling
  - Material UI: Would fight against the custom design constantly
- **Impact**: How styles are authored, component styling approach, no build-time CSS processing needed beyond standard CSS modules

### ADR-005: Provider Pattern for Multi-Game Support
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use Provider pattern (interface + concrete implementations) for game support
- **Reason**: Allows adding new games without modifying existing code (Open/Closed Principle). Each game's logic is self-contained.
- **Alternatives Evaluated**:
  - Configuration-based: Game definitions in JSON. Too rigid, can't express complex detection/install logic
  - Plugin system: Over-engineered for this scope. Adds loading/security complexity.
- **Impact**: How new games are added, backend service organization

### ADR-006: JSON for Configuration Storage
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use JSON files for all persistent configuration
- **Reason**: Native to JavaScript, human-readable, no external parser needed, electron-store provides simple API, zod validates schemas
- **Alternatives Evaluated**:
  - SQLite: Over-engineered for key-value config, adds native dependency
  - YAML: Requires parser library, indentation-sensitive format is error-prone
  - TOML: Less common in JS ecosystem, requires parser
- **Impact**: How configuration is read/written, migration strategy

### ADR-011: Unified Sidebar Navigation (TitleBar without nav)
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: SideNav is the only primary navigation. TitleBar contains only brand name and window controls (minimize, maximize, close).
- **Reason**: Duplicate navigation between TitleBar and SideNav caused confusion. The sidebar is the natural navigation pattern for desktop applications with multiple sections. Removing nav from TitleBar simplifies the layout and eliminates inconsistency.
- **Alternatives Evaluated**:
  - TitleBar-only nav: Would eliminate sidebar, but sidebar provides space for game-specific navigation
  - Both: Created confusion about which nav to use
  - Tab-based navigation: Not suitable for desktop app with sidebar
- **Impact**: Layout component structure, TitleBar.tsx, user navigation model

### ADR-012: Archive Extraction Library (adm-zip)
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use `adm-zip` as the primary archive extraction library
- **Reason**: Native JavaScript (no native bindings), pure JS implementation works in Electron's sandboxed environment, supports ZIP format which covers >95% of mod packages, well-maintained, small footprint.
- **Alternatives Evaluated**:
  - `decompress`: Supports multiple formats but less maintained
  - `extract-zip`: ZIP only, wrapper around yauzl
  - `archiver`: For creating archives, not extracting
  - `node-stream-zip`: ZIP only, streaming-focused
- **Impact**: ArchiveService implementation, package installation pipeline

### ADR-013: Inline Catalog Fallback (No Remote for v1)
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: v1 ships with a bundled catalog of 8 mods. No remote fetching. The `LocalCatalogProvider` reads from `catalog.json` on disk with inline fallback.
- **Reason**: V1 targets a small user group (5-10 friends). A remote catalog requires hosting, authentication strategy, and update mechanism that is not justified for the initial release. Pull-Only architecture.
- **Impact**: BrowseModsPage shows bundled mods only. Future v2 can add `RemoteCatalogProvider`.

### ADR-014: Mod Ownership via SHA-256 Hash
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Each installed file stores its SHA-256 hash in the mod registry. On uninstall/disable, the current file hash is compared to the stored hash. If different, the file is skipped (presumed user-modified).
- **Reason**: Prevents accidental removal of user-modified files. Empty hash string (`''`) skips verification for backward compatibility with mods installed before hash tracking.
- **Impact**: Uninstall and disable operations have an additional safety check

### ADR-007: Result Pattern Instead of Exceptions
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Service methods return Result<T, AppError> instead of throwing exceptions
- **Reason**: Forces callers to handle errors. Makes error paths explicit. TypeScript can enforce handling. Better than try/catch chains.
- **Alternatives Evaluated**:
  - Try/catch: Errors are invisible in function signatures, easy to forget handling
  - Either monad: Too functional/abstract for this codebase
- **Impact**: Every service method signature, IPC error handling, store action patterns

### ADR-008: Electron Forge with Vite
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use Electron Forge as build/package tool with Vite plugin for bundling
- **Reason**: Electron Forge is the official build tool. Vite provides fast HMR and modern bundling. The Vite plugin is well-maintained.
- **Alternatives Evaluated**:
  - electron-builder: Popular but not officially maintained by Electron team
  - Webpack: Slower HMR, more configuration required
- **Impact**: Build configuration, dev experience, packaging

### ADR-009: pnpm as Package Manager
- **Date**: 2026-07-24
- **Status**: Accepted
- **Decision**: Use pnpm instead of npm or yarn
- **Reason**: Faster installs, disk-efficient (symlinked node_modules), strict dependency resolution prevents phantom dependencies
- **Alternatives Evaluated**:
  - npm: Slower, duplicates packages, less strict
  - yarn: Good but pnpm is faster and more disk-efficient
- **Impact**: CI/CD scripts, lockfile format, developer setup instructions

### ADR-010: Typography Stack (DM Sans + Outfit + JetBrains Mono)
- **Date**: 2026-07-24 (updated)
- **Status**: Accepted
- **Decision**: Use three-font stack: DM Sans (body/code), Outfit (display/headings), JetBrains Mono (mono/code)
- **Reason**: Geist was flagged as an overused AI font by the Impeccable detector. DM Sans provides excellent legibility at small sizes in dark environments. Outfit has a modern geometric display quality suited for headings. JetBrains Mono is purpose-built for code and data display. Each font is optimized for its role.
- **Alternatives Evaluated**:
  - Geist: Original choice. Flagged as AI slop tell.
  - Inter: Also overused in AI-generated UIs.
  - System fonts: Inconsistent across platforms.
  - Single font for everything: Less distinctive than a curated pair.
- **Impact**: Font loading strategy, typography CSS variables, design consistency
