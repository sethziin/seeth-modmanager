import { create } from 'zustand';

interface AppState {
  readonly activeGameSlug: string | null;
  readonly sidebarCollapsed: boolean;
  readonly setActiveGame: (slug: string | null) => void;
  readonly toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeGameSlug: null,
  sidebarCollapsed: false,
  setActiveGame: (slug) => set({ activeGameSlug: slug }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
