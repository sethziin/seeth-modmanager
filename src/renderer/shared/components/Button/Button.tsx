import { forwardRef } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: string;
  readonly iconPosition?: 'leading' | 'trailing';
  readonly iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'leading',
    iconOnly = false,
    className,
    children,
    ...props
  },
  ref,
): React.ReactElement {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly ? styles.iconOnly : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={classes} {...props}>
      {icon && iconPosition === 'leading' && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
      {!iconOnly && children}
      {icon && iconPosition === 'trailing' && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
    </button>
  );
});
