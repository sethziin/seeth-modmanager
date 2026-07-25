# Logging and Error Handling

## Objective
Define the logging, error handling, and notification architecture for the Entropic State Mod Manager.

## Responsibility
Provide a structured, unified approach to capturing application events, handling errors gracefully without throwing exceptions, and communicating system status to the user.

## Scope
Covers log levels, formats, file rotation, `LogService` interface, error handling strategies (Result pattern), standardized error codes, and frontend notification UI behavior.

## Dependencies
- `02-ARCHITECTURE.md` (Main/Renderer IPC communication context)
- `04-SERVICES.md` (Service layer method signatures returning `Result`)
- `10-USER-INTERFACE.md` (Design tokens and UI components)

## Logging Architecture
The project uses `electron-log` for cross-platform structured logging.

### Log Levels
- **error**: Unrecoverable failures, crashes, data corruption
- **warn**: Recoverable issues, deprecations, unexpected states
- **info**: Significant actions (mod installed, game detected, download completed)
- **debug**: Detailed operational information (file operations, IPC calls)

### Log Format
```
[2026-07-24 18:20:01.234] [INFO] [ModService] Installed mod "NaturalVision Evolved" v2.0 for game "gtav"
[2026-07-24 18:20:01.500] [ERROR] [DownloadService] Failed to download file: 404 Not Found | url=https://example.com/mod.zip
```
Format: `[timestamp] [LEVEL] [ServiceName] Message | key=value context`

### Log Destinations
- **File**: `%APPDATA%/entropic-state/logs/main.log`
- **Console**: Development only (when `process.env.NODE_ENV === 'development'`)
- **Renderer DevTools**: Forward important logs via IPC for debugging

### Log Rotation
- Max file size: 10MB
- Max files: 3 (`main.log`, `main.1.log`, `main.2.log`)
- Rotate on startup if current log exceeds size limit

### LogService Interface
```typescript
class LogService {
  info(source: string, message: string, context?: Record<string, unknown>): void
  warn(source: string, message: string, context?: Record<string, unknown>): void
  error(source: string, message: string, error?: Error, context?: Record<string, unknown>): void
  debug(source: string, message: string, context?: Record<string, unknown>): void
  getEntries(filter?: LogFilter): Promise<LogEntry[]>
  clear(): Promise<void>
}

interface LogFilter {
  level?: LogLevel
  source?: string
  from?: string   // ISO date
  to?: string     // ISO date
  search?: string
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  source: string
  message: string
  context?: Record<string, unknown>
}
```

## Error Handling Strategy

### Result Pattern
All service methods return `Result<T, AppError>` instead of throwing:
```typescript
type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E }

interface AppError {
  code: string           // e.g., 'MOD_INSTALL_FAILED', 'GAME_NOT_FOUND'
  message: string        // Human-readable message
  details?: unknown      // Technical details for logging
  recoverable: boolean   // Can the user retry?
  suggestion?: string    // What the user can do
}
```

### Error Codes
Namespaced error codes:
- `GAME_NOT_FOUND`, `GAME_INVALID_PATH`, `GAME_DETECTION_FAILED`
- `MOD_INSTALL_FAILED`, `MOD_UNINSTALL_FAILED`, `MOD_CONFLICT`, `MOD_INVALID_ARCHIVE`
- `DOWNLOAD_FAILED`, `DOWNLOAD_TIMEOUT`, `DOWNLOAD_CHECKSUM_MISMATCH`
- `CONFIG_READ_FAILED`, `CONFIG_WRITE_FAILED`, `CONFIG_VALIDATION_FAILED`
- `FS_PERMISSION_DENIED`, `FS_FILE_NOT_FOUND`, `FS_DISK_FULL`

### Frontend Error Handling
- React ErrorBoundary catches rendering errors
- Service errors displayed as Toast notifications
- Error states in Zustand stores for inline error display
- Never show raw stack traces to user
- Always provide actionable error messages

## Notification System
Notification types and their visual treatment:
- **info**: Blue icon, neutral toast, auto-dismiss 5s
- **success**: Green icon, success toast, auto-dismiss 5s
- **warning**: Yellow icon, warning toast, auto-dismiss 8s
- **error**: Red icon, error toast, requires manual dismiss

Notifications appear in top-right corner, stack vertically, animate in/out with slide transition.

## Criteria for Completion
- LogService interface is implemented with electron-log configuration.
- Base Result types and Error codes are defined.
- Toast notification UI component is created and linked to Zustand state.

## Next Steps
- Implement `LogService`.
- Refactor existing services to use the `Result` return pattern.
- Implement Toast container and components in React.

## Relation to Other Documents
- Enforces design constraints from `10-USER-INTERFACE.md` for error states.
- Mandates method signature conventions for all services defined in `04-SERVICES.md`.
