import { ipcMain, dialog, BrowserWindow } from 'electron';
import type { CacheService } from '../services/cache-service';

export function registerFsIpcHandlers(
  cache: CacheService,
  mainWindow: BrowserWindow,
): void {
  ipcMain.handle(
    'fs:select-directory',
    async (_event, title?: string) => {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: title ?? 'Select Directory',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0] ?? null;
    },
  );

  ipcMain.handle(
    'fs:get-disk-usage',
    (_event, targetPath: string) => {
      const usage = cache.getDiskUsage();
      if (!usage.success) {
        throw new Error(usage.error.message);
      }
      return usage.data;
    },
  );
}
