import styles from './ModCard.module.css';

interface ModCardProps {
  readonly name: string;
  readonly author: string;
  readonly description?: string;
  readonly version?: string;
  readonly category?: string;
  readonly thumbnailUrl?: string;
  readonly installed?: boolean;
  readonly onUpdate?: () => void;
  readonly onUninstall?: () => void;
}

export function ModCard({
  name,
  author,
  description,
  version,
  category,
  thumbnailUrl,
  installed = false,
  onUpdate,
  onUninstall,
}: ModCardProps): React.ReactElement {
  return (
    <div className={styles.modCard}>
      <div className={styles.thumbnail}>
        {thumbnailUrl ? (
          <img className={styles.thumbnailImage} src={thumbnailUrl} alt={name} />
        ) : (
          <span className={`${styles.thumbnailIcon} material-symbols-outlined`}>inventory_2</span>
        )}
      </div>
      <div className={styles.modInfo}>
        <div className={styles.modName}>{name}</div>
        <div className={styles.modAuthor}>by {author}</div>
        {description && <div className={styles.modDescription}>{description}</div>}
        <div className={styles.modMeta}>
          {version && <span className={styles.chip}>v{version}</span>}
          {category && <span className={styles.chip}>{category}</span>}
          {installed && <span className={`${styles.chip} ${styles.active}`}>Installed</span>}
        </div>
      </div>
      <div className={styles.actions}>
        {installed && onUpdate && (
          <button className={styles.chip} onClick={onUpdate}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>update</span>
            Update
          </button>
        )}
        {installed && onUninstall && (
          <button className={styles.chip} onClick={onUninstall}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
            Remove
          </button>
        )}
        {!installed && (
          <button className={`${styles.chip} ${styles.active}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
            Install
          </button>
        )}
      </div>
    </div>
  );
}
