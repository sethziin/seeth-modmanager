# Testing Strategy

## Objective
Define a pragmatic, reliable testing strategy for the Entropic State Mod Manager.

## Responsibility
Ensure critical paths are covered by tests without slowing down development with unnecessary coverage requirements. Define testing stack, structure, and mocking practices.

## Scope
Covers unit tests, component tests, naming conventions, mock usage, test organization, and continuous integration commands. Excludes comprehensive E2E testing for the initial MVP.

## Dependencies
- `04-SERVICES.md` (Targeting core logic for unit tests)
- `14-STATE-MANAGEMENT.md` (Testing Zustand stores)

## Testing Philosophy
Pragmatic testing focused on critical paths. Not aiming for 100% coverage, but ensuring core functionality is reliable.

## Testing Stack
- **Unit tests**: Vitest (fast, Vite-native, TypeScript-first)
- **Component tests**: Vitest + `@testing-library/react`
- **E2E tests**: Playwright (future, not in MVP)

## What to Test

### Must Test (critical paths)
- Service methods (`ModService`, `GameService`, `DownloadService`, `ConfigService`)
- Provider implementations (`GTAVProvider` detection, validation, install)
- IPC handler request-response flow
- Zustand store actions and state transitions
- Zod schema validations
- Utility functions (path manipulation, formatting)

### Should Test (important but less critical)
- Component rendering with different props
- Error states and loading states
- Config migration between versions

### Optional (nice to have)
- Visual regression tests
- E2E flows
- Performance benchmarks

## Test File Organization
Co-locate test files with source:
```
src/main/services/mod-service.ts
src/main/services/mod-service.test.ts
src/renderer/shared/stores/mod.store.ts
src/renderer/shared/stores/mod.store.test.ts
```

## Test Naming Convention
```typescript
describe('ModService', () => {
  describe('installMod', () => {
    it('should install mod files to game directory', () => { ... })
    it('should create backup before installation', () => { ... })
    it('should return error when archive is invalid', () => { ... })
    it('should detect file conflicts with existing mods', () => { ... })
  })
})
```

## Mocking Strategy
- Mock `FileSystemService` for service tests (don't touch real file system)
- Mock `electronAPI` for store tests (don't need real IPC)
- Use zod schemas to generate test data
- Create factory functions for test data (`createTestMod`, `createTestGame`)

## Running Tests
```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report
pnpm test:main     # Main process tests only
pnpm test:renderer # Renderer tests only
```

## Criteria for Completion
- Vitest and React Testing Library are configured.
- Mock implementations of core system APIs (fs, ipc) are available for test environments.
- Core service and store tests execute successfully via `pnpm test`.

## Next Steps
- Setup Vitest config for main and renderer processes.
- Write initial test cases for `ConfigService` and `GameService`.
- Create factory utilities for testing mock states.

## Relation to Other Documents
- Applies testing practices to the modules defined in `04-SERVICES.md` and `14-STATE-MANAGEMENT.md`.
