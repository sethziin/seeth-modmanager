import styles from './Spinner.module.css';

interface SpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps): React.ReactElement {
  return (
    <div className={`${styles.spinner} ${styles[size]}`}>
      <svg viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" />
      </svg>
    </div>
  );
}
