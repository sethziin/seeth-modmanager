import { useEffect } from 'react';
import { useDownloadStore } from '../../shared/stores/useDownloadStore';
import { Button } from '../../shared/components/Button';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import styles from './DownloadsPage.module.css';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatEta(seconds: number): string {
  if (seconds < 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function DownloadsPage(): React.ReactElement {
  const { activeDownloads, completedDownloads, loading, loadQueue, cancelDownload } =
    useDownloadStore();

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Downloads</h1>

      <div className={styles.toolbar}>
        <Button variant="secondary" icon="refresh" onClick={() => void loadQueue()}>
          Refresh
        </Button>
      </div>

      {loading && <Spinner />}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Active ({activeDownloads.length})
        </h2>
        {activeDownloads.length === 0 && !loading ? (
          <EmptyState
            icon="download_done"
            title="No Active Downloads"
            description="Downloaded mods will appear here with progress tracking."
          />
        ) : (
          activeDownloads.map((dl) => (
            <div key={dl.id} className={styles.downloadItem}>
              <div className={styles.downloadInfo}>
                <div className={styles.downloadName}>{dl.fileName || dl.url}</div>
                <div className={styles.downloadMeta}>
                  {formatBytes(dl.bytesDownloaded)} / {formatBytes(dl.totalBytes)}
                  {dl.speed > 0 && ` · ${formatSpeed(dl.speed)} · ETA ${formatEta(dl.eta)}`}
                </div>
              </div>
              <div className={styles.downloadProgress}>
                <ProgressBar value={dl.progress} />
                <div className={styles.downloadProgressText}>{Math.round(dl.progress)}%</div>
              </div>
              <div className={styles.downloadActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="close"
                  iconOnly
                  onClick={() => void cancelDownload(dl.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {completedDownloads.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>History ({completedDownloads.length})</h2>
          {completedDownloads.map((dl) => (
            <div key={dl.id} className={styles.downloadItem}>
              <div className={styles.downloadInfo}>
                <div className={styles.downloadName}>{dl.fileName || dl.url}</div>
                <div className={styles.downloadMeta}>
                  {formatBytes(dl.totalBytes)}
                  {dl.completedAt && ` · ${new Date(dl.completedAt).toLocaleString()}`}
                </div>
              </div>
              <span
                className={`${styles.statusBadge} ${
                  dl.status === 'completed'
                    ? styles.statusCompleted
                    : dl.status === 'failed'
                      ? styles.statusFailed
                      : styles.statusCancelled
                }`}
              >
                {dl.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
