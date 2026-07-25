# Entropic State - Coding Standards

## Objective
To establish strict, unified coding conventions across the Entropic State Mod Manager repository, ensuring consistency, readability, and predictability for AI agents modifying the codebase.

## Responsibility
This document governs file naming, code organization, TypeScript strictness, React paradigms, and Git workflows.

## Scope
Applies to all TypeScript, TSX, CSS, and JSON files within the repository. It dictates syntax rules, architectural style at the file level, and version control hygiene.

## Dependencies (on other docs)
- Requires `03-ARCHITECTURE.md` to understand the architectural components being styled (Stores, Services, Providers).

## Criteria for Completion
Complete when all naming conventions, type rules, React hooks patterns, and Git standards are explicitly outlined and unambiguous.

## Next Steps
- Enforce these rules via ESLint, Prettier, and TypeScript compiler configurations (`tsconfig.json`).
- Configure Husky hooks to validate commit messages against the Git Conventions.

## Relation to Other Documents
- **`03-ARCHITECTURE.md`**: Architecture dictates *what* components are built; this document dictates *how* they are written.
- **`05-BACKEND.md`**: Provides specific implementation details for backend services, which must adhere to the naming and typing rules defined here.

---

## Naming Conventions
- **Files**: Use `kebab-case` for all files (e.g., `mod-service.ts`, `game-card.tsx`, `use-mods.ts`).
- **React Components**: Use `PascalCase` (e.g., `GameCard`, `ModList`, `SideNavBar`).
- **Functions & Variables**: Use `camelCase` (e.g., `installMod`, `gameVersion`).
- **Constants**: Use `UPPER_SNAKE_CASE` (e.g., `MAX_DOWNLOAD_RETRIES`, `DEFAULT_CONFIG`).
- **Types & Interfaces**: Use `PascalCase` with highly descriptive names (e.g., `InstalledMod`, `GameProvider`, `ModInstallResult`). Do not prefix with `I` or `T`.
- **Enums**: Use `PascalCase` for the enum name and `PascalCase` for members (e.g., `ModCategory.Graphics`).
- **IPC Channels**: Use `kebab-case` with a colon namespace separator (e.g., `mod:install`, `game:detect`, `config:get`).
- **Zustand Stores**: Prefix with `use` and suffix with `Store` (e.g., `useModStore`, `useGameStore`).
- **React Hooks**: Prefix with `use` followed by the action/domain (e.g., `useMods`, `useGameDetection`).
- **CSS Custom Properties**: Prefix with domain types: `--color-[name]`, `--spacing-[name]`, `--font-[name]`.

## File Organization
- **Single Responsibility**: One React component or one backend Service class per file.
- **Co-location**: Group a component, its styles, and its types in the same directory (e.g., `component.tsx`, `component.css`, `component.types.ts`).
- **Barrel Files**: Export public modules from an `index.ts` barrel file at the root of each feature directory.
- **File Length Limits**: Files must be kept under 300 lines of code. Extract logic to helpers or sub-components if exceeded.

## TypeScript Rules
- **Strict Mode**: `strict: true` must be enabled in `tsconfig.json`.
- **No Any**: The `any` type is strictly forbidden. Use `unknown` and perform runtime type narrowing instead.
- **Interfaces vs Types**: Prefer `interface` for defining object shapes. Prefer `type` for unions, intersections, and primitives.
- **Explicit Returns**: Always explicitly type function return values to prevent accidental type inference leaks.
- **Immutability**: Use the `readonly` modifier for interface properties and `ReadonlyArray` where data should not be mutated.
- **Const Assertions**: Use `as const` for literal arrays and objects that represent static configuration.
- **State Machines**: Use Discriminated Unions to represent complex state machines (e.g., Download status: `{ type: 'downloading', progress: number } | { type: 'complete', path: string }`).
- **Runtime Validation**: Use Zod schemas to parse and validate all external data (config files, API responses, IPC payloads).

## React Patterns
- **Functional Components**: Use functional components exclusively. Class components are forbidden.
- **Composition**: Prefer component composition (via the `children` prop) over inheritance or deep prop drilling.
- **Custom Hooks**: Extract complex state logic and side effects into custom hooks for reusability and testability.
- **Purity**: Keep components pure where possible. Side effects must be isolated within `useEffect` or event handlers.
- **Memoization**: Use `React.memo()`, `useMemo`, and `useCallback` *only* when a measured performance bottleneck exists. Premature optimization is discouraged.
- **Props Interfaces**: Name prop interfaces as `[ComponentName]Props` (e.g., `GameCardProps`).
- **Event Handlers**: Prefix local event handler functions with `handle` (e.g., `handleDownloadClick`). Prefix event handler props with `on` (e.g., `onDownloadComplete`).

## Import Order
Enforce the following absolute import ordering with a blank line between groups:
1. External dependencies (`react`, `zustand`, `electron`, etc.)
2. Shared types and constants (`@shared/types/...`)
3. Shared components and hooks (`@renderer/components/...`)
4. Feature-local imports (`./sub-component`, `./utils`)
5. Styles (`./component.css`)

## Error Handling
- **No Silent Failures**: Never swallow errors in empty `catch` blocks.
- **Contextual Logging**: Always log caught errors with contextual metadata indicating where and why it failed.
- **Result Pattern**: Use the `Result<T, AppError>` pattern in backend services to enforce explicit error handling at the call site.
- **Error Boundaries**: Use React Error Boundaries wrapping feature modules to catch unexpected UI crashes gracefully.
- **User Messaging**: Translate technical `AppError` payloads into user-friendly UI notifications, while logging the technical details to the `LogService`.

## Comments
- **Focus on the Why**: Comments must explain *why* a decision was made or a workaround was implemented, not *what* the code is doing (the code should be self-documenting).
- **JSDoc**: Use JSDoc format (`/** ... */`) for all public APIs, Service methods, and shared utilities.
- **No Dead Code**: Commented-out code blocks are strictly forbidden. Use version control for history.
- **TODOs**: Format TODOs uniformly: `// TODO(issue-id): brief description of pending work`.

## Git Conventions
- **Conventional Commits**: Commit messages must follow the Conventional Commits specification (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **Atomic Commits**: One logical change per commit. Do not bundle unrelated features or fixes.
- **Branch Naming**: Prefix branches with their type: `feature/[name]`, `fix/[name]`, `chore/[name]`.
