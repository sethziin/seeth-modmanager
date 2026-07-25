import { useEffect, useState } from 'react';
import type { LogEntry, LogLevel } from '../../../shared/types';
import { getIpcAdapter } from '../../shared/lib/ipc-adapter';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Chip } from '../../shared/components/Chip';
import { Spinner } from '../../shared/components/Spinner';
import styles from './LogsPage.module.css';

const LEVELS: readonly LogLevel[] = ['error', 'warn', 'info', 'debug'];

export function LogsPage(): React.ReactElement {
  const [entries, setEntries] = useState<readonly LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void loadLogs();
  }, []);

  const loadLogs = async (): Promise<void> => {
    setLoading(true);
    try {
      const adapter = getIpcAdapter();
      const logs = await adapter.log.getEntries();
      setEntries(logs);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleClear = async (): Promise<void> => {
    const adapter = getIpcAdapter();
    await adapter.log.clear();
    setEntries([]);
  };

  const filtered = entries.filter((entry) => {
    if (levelFilter && entry.level !== levelFilter) return false;
    if (search && !entry.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Logs</h1>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Input
            icon="search"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {LEVELS.map((level) => (
            <Chip
              key={level}
              label={level}
              active={levelFilter === level}
              onClick={() => setLevelFilter(levelFilter === level ? null : level)}
            />
          ))}
        </div>
        <Button variant="secondary" icon="refresh" onClick={() => void loadLogs()}>
          Refresh
        </Button>
        <Button variant="ghost" icon="delete_sweep" onClick={() => void handleClear()}>
          Clear
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className={styles.logContainer}>
          <div className={styles.logHeader}>
            <span className={styles.logHeaderTime}>Timestamp</span>
            <span className={styles.logHeaderLevel}>Level</span>
            <span className={styles.logHeaderSource}>Source</span>
            <span className={styles.logHeaderMessage}>Message</span>
          </div>
          <div className={styles.logEntries}>
            {filtered.length === 0 ? (
              <div className={styles.emptyLog}>
                <span className={`${styles.emptyLogIcon} material-symbols-outlined`}>terminal</span>
                <span>No log entries</span>
              </div>
            ) : (
              filtered.map((entry, i) => (
                <div key={`${entry.timestamp}-${i}`} className={styles.logEntry}>
                  <span className={styles.logTime}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className={`${styles.logLevel} ${styles[`level${entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}`]}`}>
                    {entry.level}
                  </span>
                  <span className={styles.logSource}>{entry.source}</span>
                  <span className={styles.logMessage}>{entry.message}</span>
                </div>
              ))
            )}
          </div>
          <div className={styles.logCount}>
            {filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}
            {filtered.length !== entries.length ? ` of ${entries.length} total` : ''}
          </div>
        </div>
      )}
    </div>
  );
}
