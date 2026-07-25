import { useEffect, useCallback } from 'react';
import { toast } from '../shared/components/Toast';
import { getIpcAdapter } from '../shared/lib/ipc-adapter';
import { useDownloadStore } from '../shared/stores/useDownloadStore';
import type { DownloadProgress, DownloadResult } from '../../shared/types';

export function IpcListenerProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const loadQueue = useDownloadStore((s) => s.loadQueue);

  const handleDownloadComplete = useCallback(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    let cleanupProgress: (() => void) | undefined;
    let cleanupComplete: (() => void) | undefined;
    let cleanupError: (() => void) | undefined;
    let cleanupInstallProgress: (() => void) | undefined;

    try {
      const adapter = getIpcAdapter();

      cleanupProgress = adapter.download.onProgress((progress: DownloadProgress) => {
        const store = useDownloadStore.getState();
        const dl = store.activeDownloads.find((d) => d.id === progress.downloadId);
        if (dl) {
          useDownloadStore.setState({
            activeDownloads: store.activeDownloads.map((d) =>
              d.id === progress.downloadId
                ? {
                    ...d,
                    bytesDownloaded: progress.bytesDownloaded,
                    totalBytes: progress.totalBytes,
                    speed: progress.speed,
                    eta: progress.eta,
                    progress: progress.totalBytes > 0 ? (progress.bytesDownloaded / progress.totalBytes) * 100 : 0,
                  }
                : d,
            ),
          });
        }
      });

      cleanupComplete = adapter.download.onComplete((result: DownloadResult) => {
        toast('success', 'Download Complete', `${result.filePath.split(/[/\\]/).pop()} downloaded successfully`);
        handleDownloadComplete();
      });

      cleanupError = adapter.download.onError((error: { downloadId: string; error: string }) => {
        toast('error', 'Download Failed', error.error);
      });

      cleanupInstallProgress = adapter.mod.onInstallProgress((progress: { stage: string; message: string }) => {
        if (progress.stage === 'done') {
          toast('success', 'Mod Installed', progress.message);
        }
      });
    } catch {
      // Running outside Electron
    }

    return () => {
      cleanupProgress?.();
      cleanupComplete?.();
      cleanupError?.();
      cleanupInstallProgress?.();
    };
  }, [handleDownloadComplete]);

  return <>{children}</>;
}
