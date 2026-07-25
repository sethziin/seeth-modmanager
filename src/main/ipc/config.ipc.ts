import { ipcMain } from 'electron';
import type { ConfigService } from '../services/config-service';
import type { IpcChannelMap } from '../../shared/types/ipc.types';

type ConfigChannel = keyof Pick<
  IpcChannelMap,
  'config:get' | 'config:set' | 'config:reset'
>;

export function registerConfigIpcHandlers(config: ConfigService): void {
  ipcMain.handle('config:get', (): IpcChannelMap['config:get']['result'] => {
    const result = config.getConfig();
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });

  ipcMain.handle(
    'config:set',
    (_event, updates: IpcChannelMap['config:set']['params'][0]) => {
      const result = config.updateConfig(updates);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  );

  ipcMain.handle('config:reset', (): IpcChannelMap['config:reset']['result'] => {
    const result = config.resetConfig();
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });
}
