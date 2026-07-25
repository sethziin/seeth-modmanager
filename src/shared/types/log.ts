export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly source: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export interface LogFilter {
  readonly level?: LogLevel;
  readonly source?: string;
  readonly from?: string;
  readonly to?: string;
  readonly search?: string;
}
