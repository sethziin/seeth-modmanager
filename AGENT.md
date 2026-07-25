# AGENT.md

## Objective
Define the master rules, behavioral constraints, and operational guidelines for all AI agents working on the Entropic State project.

## Responsibility
Ensure AI agents adhere perfectly to the project standards, architecture, technology stack, and workflows.

## Scope
Applies to ALL AI agent interactions, code generation, refactoring, and project management tasks throughout the lifetime of the repository.

## Dependencies
This file references all documentation files within the `docs/` directory.

## Criteria for Completion
Agents must consistently parse, understand, and follow these rules without deviation. This file is active and complete.

## Next Steps
AI agents MUST read this file entirely prior to executing code modifications or starting any session.

## Relation to Other Documents
Acts as the root governance document that enforces adherence to all other specific documentation files (e.g., architecture, stack, standards, decisions).

---

## Project: Entropic State - Mod Manager

### What is this file?
This file contains ALL rules that any AI agent must follow when working on this project. Read this file COMPLETELY before writing any code. Non-compliance with these rules is not acceptable.

### Rule 1: Read Before Write
- Read ALL documentation in the docs/ folder before writing any code
- Reading order:
  1. docs/00-README.md (start here)
  2. docs/01-PROJECT_CONTEXT.md (understand the project)
  3. docs/02-STACK.md (understand the technology)
  4. docs/03-ARCHITECTURE.md (understand the architecture)
  5. docs/04-CODING_STANDARDS.md (understand the conventions)
  6. ALL remaining docs
  7. docs/18-ROADMAP.md (understand the implementation order)
  8. docs/19-CURRENT_TASK.md (understand current state)
  9. docs/20-DECISIONS.md (understand past decisions)
- Never skip any document
- Never assume you know the architecture without reading the docs

### Rule 2: Implementation Order
Follow this exact order. NEVER deviate without documenting the reason in DECISIONS.md:
1. Read all documentation
2. Understand architecture completely
3. Understand the stack
4. Validate folder structure
5. Implement backend services (src/main/services/)
6. Test backend services
7. Implement IPC layer (src/main/ipc/, src/preload/)
8. Test IPC layer
9. Implement shared types (src/shared/)
10. Implement design system (CSS, layout shell)
11. Implement shared UI components (src/renderer/shared/components/)
12. Implement Zustand stores (src/renderer/shared/stores/)
13. Implement feature pages (src/renderer/features/)
14. Integrate frontend with backend
15. Test end-to-end flows
16. Polish and optimize
17. Update documentation
18. Update CURRENT_TASK.md

**NEVER start frontend before backend is complete and tested.**
**NEVER start feature pages before shared components are done.**

### Rule 3: TypeScript Strict Mode
- Always use `strict: true` in tsconfig.json
- NEVER use `any`. Use `unknown` and type-narrow.
- NEVER use `@ts-ignore` or `@ts-expect-error` without a comment explaining why
- Always type function return values explicitly
- Always type function parameters explicitly
- Use `readonly` wherever possible
- Use `const` assertions for literal types
- Use discriminated unions for state variants

### Rule 4: Code Quality
- No code duplication. Extract shared logic into utilities or services.
- Keep files under 300 lines. Split if longer.
- One component per file.
- One service per file.
- Use descriptive names. Avoid abbreviations.
- Document WHY, not WHAT.
- No commented-out code.
- No magic numbers. Use named constants.
- Prefer composition over inheritance.
- Prefer pure functions.
- Handle all error cases explicitly.

### Rule 5: Architecture Integrity
- NEVER modify the architecture without documenting the reason in docs/20-DECISIONS.md
- NEVER import main process code in renderer process
- NEVER import renderer process code in main process
- ALWAYS use IPC for cross-process communication
- ALWAYS use the Provider pattern for game-specific logic
- ALWAYS use the Service pattern for backend logic
- ALWAYS use Zustand stores for frontend state
- ALWAYS use CSS custom properties for theming
- NEVER add new dependencies without documenting in DECISIONS.md

### Rule 6: Separation of Concerns
- Main process: file system, network, game detection, mod operations
- Renderer process: UI rendering, user interactions, state display
- Preload: bridge between main and renderer (nothing else)
- Shared: types, constants, schemas (no logic)
- Each service has one responsibility
- Each component has one responsibility
- Each store manages one domain

### Rule 7: Error Handling
- Use Result<T, AppError> pattern in all services
- Never throw exceptions in service methods
- Always log errors with context (service name, method name, parameters)
- Always provide user-friendly error messages
- Always indicate if the error is recoverable
- Use ErrorBoundary for unexpected React errors
- Display errors as Toast notifications

### Rule 8: Documentation Maintenance
- Update docs/19-CURRENT_TASK.md after every significant change
- Log new decisions in docs/20-DECISIONS.md
- Check off items in docs/21-CHECKLIST.md as you complete them
- Never leave documentation outdated

### Rule 9: Testing
- Write tests for all service methods
- Write tests for all store actions
- Run tests before marking a phase as complete
- Use descriptive test names: "should [expected behavior] when [condition]"
- Mock external dependencies (file system, IPC)

### Rule 10: Consistency
- Follow naming conventions from docs/04-CODING_STANDARDS.md exactly
- Follow folder structure from docs/02-STACK.md exactly
- Follow import order from docs/04-CODING_STANDARDS.md
- Follow component patterns from docs/12-COMPONENTS.md
- Follow IPC patterns from docs/06-IPC.md
- Follow state patterns from docs/13-STATE.md
- Follow theming patterns from docs/14-THEMING.md

### Rule 11: Git Discipline
- Use conventional commits: feat:, fix:, docs:, refactor:, chore:, test:
- One logical change per commit
- Never commit broken code
- Never commit with failing tests

### Rule 12: Performance
- Avoid unnecessary re-renders (check with React DevTools)
- Use React.memo() only when measured, not preemptively
- Debounce search inputs (300ms)
- Throttle progress updates from main process (250ms)
- Lazy load heavy feature modules if needed
- Clean up IPC listeners on component unmount

### Rule 13: Security
- contextIsolation: true (always)
- nodeIntegration: false (always)
- Validate all data crossing IPC boundary with zod
- Never expose file system paths in error messages to users
- Sanitize file paths to prevent directory traversal

### Quick Reference: File Naming
| Type | Convention | Example |
|------|-----------|--------|
| Component | PascalCase.tsx | GameCard.tsx |
| Component CSS | PascalCase.module.css | GameCard.module.css |
| Service | kebab-case.ts | mod-service.ts |
| Store | kebab-case.store.ts | mod.store.ts |
| Hook | use-kebab-case.ts | use-mods.ts |
| Type file | kebab-case.types.ts | game.types.ts |
| IPC handler | kebab-case.ipc.ts | mod.ipc.ts |
| Provider | kebab-case.provider.ts | gtav.provider.ts |
| Test | [filename].test.ts | mod-service.test.ts |
| Constants | kebab-case.constants.ts | app.constants.ts |
| Schema | kebab-case.schema.ts | config.schema.ts |
| Utility | kebab-case.ts | format.ts |
