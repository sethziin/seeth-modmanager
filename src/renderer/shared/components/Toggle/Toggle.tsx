import { useId } from 'react';
import styles from './Toggle.module.css';

interface ToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly label?: string;
}

export function Toggle({ checked, onChange, disabled, label }: ToggleProps): React.ReactElement {
  const id = useId();

  return (
    <label className={styles.toggle} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      {label && <span style={{ marginLeft: 8 }}>{label}</span>}
    </label>
  );
}
