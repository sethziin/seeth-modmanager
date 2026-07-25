import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { LogService } from './log-service';

describe('LogService', () => {
  let logDir: string;
  let service: LogService;

  beforeEach(() => {
    logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'log-test-'));
    service = new LogService(logDir, { level: 'debug' });
  });

  afterEach(() => {
    fs.rmSync(logDir, { recursive: true, force: true });
  });

  it('should create log directory if it does not exist', () => {
    const newDir = path.join(logDir, 'nested', 'logs');
    const newService = new LogService(newDir);
    newService.info('test', 'message');
    expect(fs.existsSync(newDir)).toBe(true);
  });

  it('should write info level log entries', () => {
    service.info('TestService', 'Test message');
    const logFile = path.join(logDir, 'main.log');
    expect(fs.existsSync(logFile)).toBe(true);
    const content = fs.readFileSync(logFile, 'utf-8');
    expect(content).toContain('[INFO ]');
    expect(content).toContain('[TestService]');
    expect(content).toContain('Test message');
  });

  it('should write error level log entries', () => {
    service.error('TestService', 'Error occurred', new Error('test error'));
    const logFile = path.join(logDir, 'main.log');
    const content = fs.readFileSync(logFile, 'utf-8');
    expect(content).toContain('[ERROR]');
    expect(content).toContain('Error occurred');
    expect(content).toContain('errorMessage=test error');
  });

  it('should write context data', () => {
    service.info('TestService', 'With context', { key: 'value', count: 42 });
    const logFile = path.join(logDir, 'main.log');
    const content = fs.readFileSync(logFile, 'utf-8');
    expect(content).toContain('key=value');
  });

  it('should filter entries by level', () => {
    service.debug('S', 'debug msg');
    service.info('S', 'info msg');
    service.warn('S', 'warn msg');
    service.error('S', 'error msg');

    return service.getEntries({ level: 'info' }).then((entries) => {
      expect(entries).toHaveLength(3);
    });
  });

  it('should filter entries by source', () => {
    service.info('ServiceA', 'msg A');
    service.info('ServiceB', 'msg B');

    return service.getEntries({ source: 'ServiceA' }).then((entries) => {
      expect(entries).toHaveLength(1);
      expect(entries[0]?.source).toBe('ServiceA');
    });
  });

  it('should filter entries by search text', () => {
    service.info('S', 'Hello world');
    service.info('S', 'Goodbye world');

    return service.getEntries({ search: 'Hello' }).then((entries) => {
      expect(entries).toHaveLength(1);
      expect(entries[0]?.message).toBe('Hello world');
    });
  });

  it('should clear all log files', async () => {
    service.info('S', 'message');
    await service.clear();
    const entries = await service.getEntries();
    expect(entries).toHaveLength(0);
  });

  it('should respect log level filtering', () => {
    const warnService = new LogService(logDir, { level: 'warn' });
    warnService.debug('S', 'debug');
    warnService.info('S', 'info');
    warnService.warn('S', 'warn');

    return warnService.getEntries().then((entries) => {
      expect(entries).toHaveLength(1);
      expect(entries[0]?.level).toBe('warn');
    });
  });

  it('should rotate logs when file exceeds max size', () => {
    const smallMaxSize = 100;
    const rotateService = new LogService(logDir, {
      level: 'debug',
      maxFileSizeMB: smallMaxSize / (1024 * 1024),
    });

    for (let i = 0; i < 50; i++) {
      rotateService.info('S', `Message ${i} with some padding to fill space`);
    }

    const rotatedFile = path.join(logDir, 'main.1.log');
    expect(fs.existsSync(rotatedFile)).toBe(true);
  });
});
