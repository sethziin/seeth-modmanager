import styles from './GameCard.module.css';

interface GameCardProps {
  readonly name: string;
  readonly slug: string;
  readonly modCount?: number;
  readonly coverUrl?: string;
  readonly active?: boolean;
  readonly onClick: (slug: string) => void;
}

export function GameCard({
  name,
  slug,
  modCount = 0,
  coverUrl,
  active = false,
  onClick,
}: GameCardProps): React.ReactElement {
  return (
    <div
      className={`${styles.gameCard} ${active ? styles.active : ''}`}
      onClick={() => onClick(slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(slug);
      }}
    >
      <div className={styles.banner}>
        {coverUrl ? (
          <img className={styles.bannerImage} src={coverUrl} alt={name} />
        ) : (
          <span className={`${styles.bannerIcon} material-symbols-outlined`}>sports_esports</span>
        )}
      </div>
      <div className={styles.gameInfo}>
        <div className={styles.gameName}>{name}</div>
        <div className={styles.gameMeta}>
          <span className={styles.badge}>
            {modCount} mod{modCount !== 1 ? 's' : ''}
          </span>
          <span>{slug}</span>
        </div>
      </div>
    </div>
  );
}
