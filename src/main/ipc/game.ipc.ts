import { ipcMain } from 'electron';
import type { GameService } from '../services/game-service';
import type { IpcChannelMap } from '../../shared/types/ipc.types';

export function registerGameIpcHandlers(gameService: GameService): void {
  ipcMain.handle(
    'game:detect-all',
    async (): Promise<IpcChannelMap['game:detect-all']['result']> => {
      const result = await gameService.detectAllGames();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  );

  ipcMain.handle(
    'game:get-details',
    async (
      _event,
      gameId: IpcChannelMap['game:get-details']['params'][0],
    ): Promise<IpcChannelMap['game:get-details']['result']> => {
      const result = await gameService.getGameDetails(gameId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  );

  ipcMain.handle(
    'game:set-directory',
    async (
      _event,
      gameId: IpcChannelMap['game:set-directory']['params'][0],
      dirPath: IpcChannelMap['game:set-directory']['params'][1],
    ): Promise<IpcChannelMap['game:set-directory']['result']> => {
      const result = await gameService.saveGameInstallation(gameId, dirPath, 'manual');
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
  );
}
