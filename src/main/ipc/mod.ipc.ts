import { ipcMain } from 'electron';
import type { ModService } from '../services/mod-service';
import type { IpcChannelMap } from '../../shared/types/ipc.types';

export function registerModIpcHandlers(modService: ModService): void {
  ipcMain.handle(
    'mod:install',
    async (
      _event,
      gameId: IpcChannelMap['mod:install']['params'][0],
      filePath: IpcChannelMap['mod:install']['params'][1],
    ): Promise<IpcChannelMap['mod:install']['result']> => {
      const result = await modService.installMod(gameId, filePath);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  );

  ipcMain.handle(
    'mod:uninstall',
    async (
      _event,
      gameId: IpcChannelMap['mod:uninstall']['params'][0],
      modId: IpcChannelMap['mod:uninstall']['params'][1],
    ): Promise<IpcChannelMap['mod:uninstall']['result']> => {
      const result = await modService.uninstallMod(gameId, modId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
  );

  ipcMain.handle(
    'mod:enable',
    async (
      _event,
      gameId: IpcChannelMap['mod:enable']['params'][0],
      modId: IpcChannelMap['mod:enable']['params'][1],
    ): Promise<IpcChannelMap['mod:enable']['result']> => {
      const result = await modService.enableMod(gameId, modId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
  );

  ipcMain.handle(
    'mod:disable',
    async (
      _event,
      gameId: IpcChannelMap['mod:disable']['params'][0],
      modId: IpcChannelMap['mod:disable']['params'][1],
    ): Promise<IpcChannelMap['mod:disable']['result']> => {
      const result = await modService.disableMod(gameId, modId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
  );

  ipcMain.handle(
    'mod:get-installed',
    async (
      _event,
      gameId: IpcChannelMap['mod:get-installed']['params'][0],
    ): Promise<IpcChannelMap['mod:get-installed']['result']> => {
      const result = await modService.getInstalledMods(gameId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  );

  ipcMain.handle(
    'mod:check-updates',
    async (
      _event,
      gameId: IpcChannelMap['mod:check-updates']['params'][0],
    ): Promise<IpcChannelMap['mod:check-updates']['result']> => {
      const result = await modService.checkForUpdates(gameId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  );
}
