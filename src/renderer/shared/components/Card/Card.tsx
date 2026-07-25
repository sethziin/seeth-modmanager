import styles from './Card.module.css';

interface CardProps {
  readonly children?: React.ReactNode;
  readonly header?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly className?: string;
}

export function Card({ children, header, footer, className }: CardProps): React.ReactElement {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      {header && <div className={styles.header}>{header}</div>}
      {children && <div className={styles.body}>{children}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
