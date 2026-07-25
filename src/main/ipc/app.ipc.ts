import { ipcMain, app } from 'electron';

export function registerAppIpcHandlers(): void {
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });
}
