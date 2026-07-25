import styles from './Chip.module.css';

interface ChipProps {
  readonly label: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly icon?: string;
}

export function Chip({
  label,
  active = false,
  onClick,
  disabled,
  icon,
}: ChipProps): React.ReactElement {
  return (
    <button
      className={`${styles.chip} ${active ? styles.active : ''}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {icon && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>}
      {label}
    </button>
  );
}
