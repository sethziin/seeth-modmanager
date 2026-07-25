# Frontend Architecture (11-FRONTEND.md)

## Objective
To define the architectural structure, routing, and data flow patterns for the React-based frontend of the Entropic State Mod Manager.

## Responsibility
This document governs the organization of the frontend codebase, component hierarchy, routing strategy, and the state management approach for the renderer process.

## Scope
Covers the React 19 application running within the Electron Chromium renderer process, including routing configuration, feature-based directory structure, the global layout shell, and the data fetching pattern utilizing Zustand and Electron IPC. Excludes backend services, main process architecture, and detailed component UI specifications.

## Dependencies
- `01-ARCHITECTURE.md` (Main vs Renderer process boundary)
- `12-COMPONENTS.md` (Specific component implementations)

## Criteria for Completion
- Clear definition of the renderer entry point and root components.
- Exhaustive documentation of the feature-based folder structure.
- Defined routing configuration using HashRouter.
- Detailed breakdown of the layout shell (TitleBar, SideNav, StatusBar).
- Standardized pattern for component communication and data fetching via stores and IPC.

## Next Steps
- Implement the base `index.tsx` and `app/App.tsx`.
- Setup `react-router-dom` with `HashRouter` and the defined routes.
- Implement the layout shell components.
- Establish the base Zustand stores.

## Relation to Other Documents
This document acts as the core guide for all frontend feature development. It relies on `12-COMPONENTS.md` for UI building blocks and interfaces with the backend as described in overarching architectural documents.

---

## Implementation Details

### Frontend Architecture
The renderer process is a React 19 application with TypeScript running inside Electron's Chromium.

### Entry Point
- `src/renderer/index.tsx` - Mounts React app to DOM
- `src/renderer/app/App.tsx` - Root component with router and layout shell

### Feature-Based Structure
```text
src/renderer/
├── index.tsx                     # Entry point
├── app/
│   ├── App.tsx                   # Root component
│   ├── App.css                   # Global styles
│   ├── Layout.tsx                # Shell layout (titlebar + sidebar + content + statusbar)
│   └── router.tsx                # Route definitions
├── features/
│   ├── dashboard/
│   │   ├── components/           # Dashboard-specific components
│   │   ├── hooks/                # Dashboard-specific hooks
│   │   ├── DashboardPage.tsx     # Page component
│   │   └── index.ts              # Barrel export
│   ├── games/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── GamesPage.tsx
│   │   └── index.ts
│   ├── mods/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── InstalledModsPage.tsx
│   │   ├── BrowseModsPage.tsx
│   │   └── index.ts
│   ├── downloads/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── DownloadsPage.tsx
│   │   └── index.ts
│   ├── settings/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── SettingsPage.tsx
│   │   └── index.ts
│   └── logs/
│       ├── components/
│       ├── hooks/
│       ├── LogsPage.tsx
│       └── index.ts
├── shared/
│   ├── components/               # Reusable UI components
│   │   ├── TitleBar/
│   │   ├── SideNav/
│   │   ├── StatusBar/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Toggle/
│   │   ├── Chip/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── ProgressBar/
│   │   ├── Spinner/
│   │   ├── EmptyState/
│   │   └── ErrorBoundary/
│   ├── hooks/                    # Shared custom hooks
│   │   ├── use-electron-api.ts
│   │   ├── use-notification.ts
│   │   └── use-debounce.ts
│   ├── stores/                   # Zustand stores
│   │   ├── game.store.ts
│   │   ├── mod.store.ts
│   │   ├── download.store.ts
│   │   ├── config.store.ts
│   │   ├── notification.store.ts
│   │   └── ui.store.ts
│   ├── styles/                   # Global styles
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── typography.css
│   │   ├── animations.css
│   │   └── scrollbar.css
│   └── utils/                    # Utility functions
│       ├── format.ts
│       ├── date.ts
│       └── validation.ts
└── types/                        # Renderer-specific types
    └── electron.d.ts             # Window.electronAPI types
```

### Routing
```typescript
const routes = [
  { path: '/', element: <DashboardPage /> },
  { path: '/games', element: <GamesPage /> },
  { path: '/games/:gameId/mods', element: <InstalledModsPage /> },
  { path: '/browse', element: <BrowseModsPage /> },
  { path: '/downloads', element: <DownloadsPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/logs', element: <LogsPage /> },
]
```
Use `HashRouter` (required for Electron - no server for history routing).

### Layout Shell
The `Layout` component provides the persistent shell:
- **TitleBar**: Custom frameless window controls (minimize, maximize, close) + app brand name. No navigation — sidebar is the primary navigation.
- **SideNav**: Left sidebar with navigation links (Dashboard, Games, Installed Mods, Browse Mods, Downloads, Settings, Logs) + app version + bottom links (Support, Legal)
- **Content Area**: Router outlet (scrollable)
- **StatusBar**: System status, sync indicators, version, copyright

### Component Communication
- **Parent → Child**: Props
- **Child → Parent**: Callback props (`onXxx`)
- **Cross-feature**: Zustand stores
- **Backend events**: IPC listeners in stores (set up on store creation)

### Data Fetching Pattern
1. Component mounts → calls store action (e.g., `useModStore.getState().fetchMods(gameId)`)
2. Store sets loading state
3. Store calls `electronAPI` method
4. On success: store updates data + clears loading
5. On error: store sets error state
6. Component re-renders from store state (loading, data, error)
