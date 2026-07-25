# Project Context

## Objective
Define the overarching goals, scope, constraints, and design principles of the Entropic State Mod Manager project.

## Responsibility
This document serves as the single source of truth for understanding *what* the project is, *why* it exists, and the conceptual boundaries of the system.

## Scope
Includes project objectives, application flow, architecture overview, constraints, supported games, target audience, and design principles. Excludes detailed technical implementation instructions.

## Project Definition
- **Objective**: Create a desktop mod manager for managing game modifications.
- **Brand**: "Entropic State" featuring a "True Dark Desktop" aesthetic.

## Architecture & Stack Overview
- **Stack**: Electron + React 19 + TypeScript (strict) + Zustand + React Router v7 + Vanilla CSS.
- **Architecture Overview**:
  - **Main Process (Electron)**: Handles file system operations, downloads, game detection, and acts as the backend.
  - **Renderer Process (React)**: Handles the UI.
  - **IPC Bridge**: Connects the Main and Renderer processes securely.

## Application Flow
1. Detect games installed on the system.
2. Select a game to manage.
3. View, install, or remove mods for the selected game.
4. Download updates for mods.
5. Manage application configurations.

## Constraints
- **No Server Backend**: All operations are local.
- **No Database**: Uses JSON configuration files instead of a database like SQLite or localdb.
- **No Authentication**: Strictly local user profiles or single user model.

## Game Support
- **Initial Scope**: GTA V only.
- **Architecture**: Multi-game support from day 1 (provider pattern).
- **Future Objectives**: Support for multiple games (Witcher 3, Cyberpunk 2077, etc.), mod conflict detection, mod profiles/presets, community mod browsing.

## Target Audience
- Developer and friends (5-10 users).
- Focus on usability for a small group rather than enterprise scalability.

## Design Principles
- **Aesthetic**: True Dark Desktop (deep dark UI with #131315 background, DM Sans + Outfit + JetBrains Mono fonts, Material Design 3 color tokens, soft blue accent #b5c4ff / #638aff).
- **Layout**: Fixed sidebar (256px), titlebar (48px), statusbar (28px), fluid content area.
- **Pages**: Dashboard, Games, Installed Mods, Browse Mods, Downloads, Settings, Logs.
- **Architecture**: Clean, organized, scalable but not enterprise, composition over inheritance, separation of concerns.

## Dependencies
- Must align with choices in `02-STACK.md` and `03-ARCHITECTURE.md`.

## Official Repositories

| Repository | URL |
|-----------|-----|
| App (main) | `https://github.com/sethziin/seeth-modmanager` |
| Catalog (mod metadata) | `https://github.com/sethziin/seeth-modmanager-catalog` |

The catalog is consumed at:
```
https://raw.githubusercontent.com/sethziin/seeth-modmanager-catalog/main/catalog.json
```

## Criteria for Completion
Considered complete when all constraints, scopes, and project visions are fully articulated without ambiguity.

## Next Steps
- Reference this document when making architectural decisions.
- Expand on design system in `14-THEMING.md`.

## Relation to Other Documents
- Referenced by `00-README.md`.
- Provides context for `02-STACK.md` and `03-ARCHITECTURE.md`.
