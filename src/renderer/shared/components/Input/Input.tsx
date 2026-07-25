import { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly icon?: string;
  readonly error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, error, className, ...props },
  ref,
): React.ReactElement {
  return (
    <div className={`${styles.inputWrapper} ${className ?? ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div
        className={`${styles.inputContainer} ${error ? styles.hasError : ''}`}
      >
        {icon && (
          <span className={`${styles.inputIcon} material-symbols-outlined`}>{icon}</span>
        )}
        <input ref={ref} className={styles.input} {...props} />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});
