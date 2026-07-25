import { create } from 'zustand';
import type { ToastType } from '../components/Toast';

interface Notification {
  readonly id: string;
  readonly type: ToastType;
  readonly title: string;
  readonly message: string;
  readonly duration: number;
}

let idCounter = 0;

interface NotificationState {
  readonly notifications: readonly Notification[];

  readonly add: (type: ToastType, title: string, message: string, duration?: number) => void;
  readonly dismiss: (id: string) => void;
  readonly clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  add: (type, title, message, duration = 5000) => {
    const id = String(++idCounter);
    set((state) => ({
      notifications: [...state.notifications.slice(-4), { id, type, title, message, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clear: () => set({ notifications: [] }),
}));
