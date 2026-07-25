import fs from 'node:fs';
import path from 'node:path';
import type { LogLevel, LogEntry, LogFilter } from '../../shared/types/log';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 3;

export class LogService {
  private readonly logDir: string;
  private currentLevel: LogLevel;
  private readonly maxFileSize: number;
  private readonly maxFiles: number;

  constructor(
    logDir: string,
    options?: {
      readonly level?: LogLevel;
      readonly maxFileSizeMB?: number;
      readonly maxFiles?: number;
    },
  ) {
    this.logDir = logDir;
    this.currentLevel = options?.level ?? 'info';
    this.maxFileSize = (options?.maxFileSizeMB ?? 10) * 1024 * 1024;
    this.maxFiles = options?.maxFiles ?? MAX_FILES;
    this.ensureLogDir();
  }

  info(source: string, message: string, context?: Record<string, unknown>): void {
    this.write('info', source, message, context);
  }

  warn(source: string, message: string, context?: Record<string, unknown>): void {
    this.write('warn', source, message, context);
  }

  error(
    source: string,
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    const errorContext: Record<string, unknown> = {
      ...context,
      ...(error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack,
          }
        : {}),
    };
    this.write('error', source, message, errorContext);
  }

  debug(source: string, message: string, context?: Record<string, unknown>): void {
    this.write('debug', source, message, context);
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  async getEntries(filter?: LogFilter): Promise<readonly LogEntry[]> {
    const logFile = this.getLogFilePath(0);
    if (!fs.existsSync(logFile)) {
      return [];
    }

    const content = fs.readFileSync(logFile, 'utf-8');
    const entries = this.parseLogFile(content);

    return entries.filter((entry) => this.matchesFilter(entry, filter));
  }

  async clear(): Promise<void> {
    for (let i = 0; i < this.maxFiles; i++) {
      const filePath = this.getLogFilePath(i);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  private write(
    level: LogLevel,
    source: string,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.currentLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      context,
    };

    const line = this.formatEntry(entry);
    this.writeToFile(line);
  }

  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const source = entry.source;
    const contextStr = entry.context
      ? ' | ' +
        Object.entries(entry.context)
          .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join(' ')
      : '';

    return `[${timestamp}] [${level}] [${source}] ${entry.message}${contextStr}\n`;
  }

  private writeToFile(line: string): void {
    const logFile = this.getLogFilePath(0);

    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size >= this.maxFileSize) {
        this.rotateLogs();
      }
    }

    fs.appendFileSync(logFile, line, 'utf-8');
  }

  private rotateLogs(): void {
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const fromPath = this.getLogFilePath(i - 1);
      const toPath = this.getLogFilePath(i);

      if (fs.existsSync(fromPath)) {
        if (fs.existsSync(toPath)) {
          fs.unlinkSync(toPath);
        }
        fs.renameSync(fromPath, toPath);
      }
    }

    const currentLog = this.getLogFilePath(0);
    if (fs.existsSync(currentLog)) {
      fs.writeFileSync(currentLog, '', 'utf-8');
    }
  }

  private getLogFilePath(index: number): string {
    const suffix = index === 0 ? '' : `.${index}`;
    return path.join(this.logDir, `main${suffix}.log`);
  }

  private parseLogFile(content: string): LogEntry[] {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    const entries: LogEntry[] = [];

    for (const line of lines) {
      const entry = this.parseLine(line);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  private parseLine(line: string): LogEntry | null {
    const match = line.match(
      /^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+([^\|]*?)(?:\s*\|\s*(.+))?$/,
    );

    if (!match) {
      return null;
    }

    const [, timestamp, level, source, message, contextStr] = match;
    if (!timestamp || !level || !source || !message) {
      return null;
    }

    let context: Record<string, unknown> | undefined;
    if (contextStr) {
      context = {};
      const pairs = contextStr.split(' ');
      for (const pair of pairs) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
          const key = pair.substring(0, eqIndex);
          const value = pair.substring(eqIndex + 1);
          context[key] = value;
        }
      }
    }

    return {
      timestamp,
      level: level.trim().toLowerCase() as LogLevel,
      source,
      message: message.trim(),
      context,
    };
  }

  private matchesFilter(entry: LogEntry, filter?: LogFilter): boolean {
    if (!filter) {
      return true;
    }

    if (filter.level && LOG_LEVELS[entry.level] < LOG_LEVELS[filter.level]) {
      return false;
    }

    if (filter.source && entry.source !== filter.source) {
      return false;
    }

    if (filter.from && entry.timestamp < filter.from) {
      return false;
    }

    if (filter.to && entry.timestamp > filter.to) {
      return false;
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      if (
        !entry.message.toLowerCase().includes(searchLower) &&
        !entry.source.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
}
