import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  readonly value?: number;
  readonly indeterminate?: boolean;
  readonly size?: 'md' | 'lg';
}

export function ProgressBar({
  value = 0,
  indeterminate = false,
  size = 'md',
}: ProgressBarProps): React.ReactElement {
  return (
    <div className={`${styles.progress} ${size === 'lg' ? styles.lg : ''}`}>
      {indeterminate ? (
        <div className={styles.indeterminate} />
      ) : (
        <div className={styles.determinate} style={{ transform: `scaleX(${Math.min(1, Math.max(0, value / 100))})` }} />
      )}
    </div>
  );
}
