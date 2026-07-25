import { useState, useEffect, useCallback } from 'react';
import styles from './Toast.module.css';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  readonly id: string;
  readonly type: ToastType;
  readonly title: string;
  readonly message: string;
  readonly duration: number;
}

const ICONS: Record<ToastType, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

let toastIdCounter = 0;
let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function toast(type: ToastType, title: string, message: string, duration = 5000): void {
  addToastFn?.({ type, title, message, duration });
}

interface ToastContainerProps {
  readonly maxToasts?: number;
}

export function ToastContainer({ maxToasts = 5 }: ToastContainerProps): React.ReactElement {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);

  const addToast = useCallback(
    (toastData: Omit<ToastItem, 'id'>) => {
      const id = String(++toastIdCounter);
      setToasts((prev) => {
        const updated = [...prev, { ...toastData, id }];
        return updated.slice(-maxToasts);
      });
    },
    [maxToasts],
  );

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className={styles.toastContainer}>
      {toasts.map((t) => (
        <ToastItemComponent key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemComponentProps {
  readonly toast: ToastItem;
  readonly onDismiss: (id: string) => void;
}

function ToastItemComponent({ toast, onDismiss }: ToastItemComponentProps): React.ReactElement {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = (): void => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]} ${exiting ? styles.toastExiting : ''}`}
      onClick={handleDismiss}
    >
      <span className={`${styles.toastIcon} material-symbols-outlined`}>
        {ICONS[toast.type]}
      </span>
      <div className={styles.toastContent}>
        <div className={styles.toastTitle}>{toast.title}</div>
        {toast.message && <div className={styles.toastMessage}>{toast.message}</div>}
      </div>
      <button className={styles.toastDismiss}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          close
        </span>
      </button>
    </div>
  );
}
