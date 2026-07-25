import styles from './EmptyState.module.css';

interface EmptyStateProps {
  readonly icon: string;
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={styles.emptyState}>
      <span className={`${styles.icon} material-symbols-outlined`}>{icon}</span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
