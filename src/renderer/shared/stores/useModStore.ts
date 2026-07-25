import { create } from 'zustand';
import type { InstalledMod, ModCategory } from '../../../shared/types';
import { getIpcAdapter } from '../lib/ipc-adapter';

export interface ModFilter {
  readonly category: ModCategory | null;
  readonly enabled: boolean | null;
  readonly search: string;
}

interface ModState {
  readonly mods: readonly InstalledMod[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly filter: ModFilter;

  readonly loadMods: (gameId: string) => Promise<void>;
  readonly installMod: (gameId: string, filePath: string) => Promise<InstalledMod>;
  readonly uninstallMod: (gameId: string, modId: string) => Promise<void>;
  readonly enableMod: (gameId: string, modId: string) => Promise<void>;
  readonly disableMod: (gameId: string, modId: string) => Promise<void>;
  readonly setFilter: (filter: Partial<ModFilter>) => void;
  readonly clearError: () => void;
  readonly filteredMods: () => readonly InstalledMod[];
}

export const useModStore = create<ModState>((set, get) => ({
  mods: [],
  loading: false,
  error: null,
  filter: { category: null, enabled: null, search: '' },

  loadMods: async (gameId) => {
    set({ loading: true, error: null });
    try {
      const adapter = getIpcAdapter();
      const mods = await adapter.mod.getInstalled(gameId);
      set({ mods, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  installMod: async (gameId, filePath) => {
    set({ loading: true, error: null });
    try {
      const adapter = getIpcAdapter();
      const installed = await adapter.mod.install(gameId, filePath);
      set((state) => ({ mods: [...state.mods, installed], loading: false }));
      return installed;
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  uninstallMod: async (gameId, modId) => {
    try {
      const adapter = getIpcAdapter();
      await adapter.mod.uninstall(gameId, modId);
      set((state) => ({
        mods: state.mods.filter((m) => m.id !== modId),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  enableMod: async (gameId, modId) => {
    try {
      const adapter = getIpcAdapter();
      await adapter.mod.enable(gameId, modId);
      set((state) => ({
        mods: state.mods.map((m) => (m.id === modId ? { ...m, enabled: true } : m)),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  disableMod: async (gameId, modId) => {
    try {
      const adapter = getIpcAdapter();
      await adapter.mod.disable(gameId, modId);
      set((state) => ({
        mods: state.mods.map((m) => (m.id === modId ? { ...m, enabled: false } : m)),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  setFilter: (partial) =>
    set((state) => ({ filter: { ...state.filter, ...partial } })),

  clearError: () => set({ error: null }),

  filteredMods: () => {
    const { mods, filter } = get();
    return mods.filter((mod) => {
      if (filter.category && mod.category !== filter.category) return false;
      if (filter.enabled !== null && mod.enabled !== filter.enabled) return false;
      if (filter.search && !mod.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  },
}));
