import { ipcMain } from 'electron';
import type { LogService } from '../services/log-service';
import type { IpcChannelMap } from '../../shared/types/ipc.types';

export function registerLogIpcHandlers(log: LogService): void {
  ipcMain.handle(
    'log:get-entries',
    async (_event, filter?: IpcChannelMap['log:get-entries']['params'][0]) => {
      return log.getEntries(filter);
    },
  );

  ipcMain.handle('log:clear', async () => {
    await log.clear();
  });
}
