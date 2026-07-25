import { create } from 'zustand';
import type { DetectedGame, GameDetails } from '../../../shared/types';
import { getIpcAdapter } from '../lib/ipc-adapter';

interface GameState {
  readonly games: readonly DetectedGame[];
  readonly selectedGame: GameDetails | null;
  readonly loading: boolean;
  readonly error: string | null;

  readonly loadGames: () => Promise<void>;
  readonly selectGame: (gameId: string) => Promise<void>;
  readonly setGameDirectory: (gameId: string, path: string) => Promise<void>;
  readonly clearError: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  games: [],
  selectedGame: null,
  loading: false,
  error: null,

  loadGames: async () => {
    set({ loading: true, error: null });
    try {
      const adapter = getIpcAdapter();
      const games = await adapter.game.detectAll();
      set({ games, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  selectGame: async (gameId) => {
    set({ loading: true, error: null });
    try {
      const adapter = getIpcAdapter();
      const details = await adapter.game.getDetails(gameId);
      set({ selectedGame: details, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  setGameDirectory: async (gameId, path) => {
    try {
      const adapter = getIpcAdapter();
      await adapter.game.setDirectory(gameId, path);
      await get().selectGame(gameId);
    } catch (err) {
      set({ error: String(err) });
    }
  },

  clearError: () => set({ error: null }),
}));

function get(): GameState {
  return useGameStore.getState();
}
