import { ipcMain } from 'electron';
import type { DownloadService } from '../services/download-service';
import type { IpcChannelMap } from '../../shared/types/ipc.types';

export function registerDownloadIpcHandlers(downloadService: DownloadService): void {
  ipcMain.handle(
    'download:start',
    async (
      _event,
      url: IpcChannelMap['download:start']['params'][0],
      metadata: IpcChannelMap['download:start']['params'][1],
    ): Promise<IpcChannelMap['download:start']['result']> => {
      const result = await downloadService.startDownload(url, metadata);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  );

  ipcMain.handle(
    'download:cancel',
    async (
      _event,
      downloadId: IpcChannelMap['download:cancel']['params'][0],
    ): Promise<IpcChannelMap['download:cancel']['result']> => {
      const result = await downloadService.cancelDownload(downloadId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
  );

  ipcMain.handle(
    'download:get-queue',
    (): IpcChannelMap['download:get-queue']['result'] => {
      return downloadService.getQueue();
    },
  );
}
