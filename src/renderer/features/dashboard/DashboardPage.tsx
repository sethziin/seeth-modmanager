import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../shared/stores/useGameStore';
import { useModStore } from '../../shared/stores/useModStore';
import { useDownloadStore } from '../../shared/stores/useDownloadStore';
import { GameCard } from '../../shared/components/GameCard';
import { Spinner } from '../../shared/components/Spinner';
import styles from './DashboardPage.module.css';

export function DashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const { games, loading: gamesLoading, loadGames } = useGameStore();
  const { mods, loadMods } = useModStore();
  const { activeDownloads, loadQueue } = useDownloadStore();

  useEffect(() => {
    void loadGames();
    void loadQueue();
  }, [loadGames, loadQueue]);

  useEffect(() => {
    const first = games[0];
    if (first) {
      void loadMods(first.id);
    }
  }, [games, loadMods]);

  const totalModCount = mods.length;
  const enabledModCount = mods.filter((m) => m.enabled).length;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div className={styles.welcomeSection}>
        <h2 className={styles.welcomeTitle}>Welcome to Seeth's Mod Manager</h2>
        <p className={styles.welcomeText}>
          Manage your game modifications from one place. Select a game from the sidebar to get
          started.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Games Detected</div>
          <div className={styles.statValue}>{games.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Installed Mods</div>
          <div className={styles.statValue}>{totalModCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Downloads</div>
          <div className={styles.statValue}>{activeDownloads.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Enabled Mods</div>
          <div className={styles.statValue}>{enabledModCount}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Games</h2>
        </div>
        {gamesLoading ? (
          <Spinner />
        ) : games.length > 0 ? (
          <div className={styles.gameList}>
            {games.map((game) => (
              <GameCard
                key={game.id}
                name={game.name}
                slug={game.slug}
                coverUrl={game.coverUrl}
                onClick={() => navigate(`/games/${game.id}/mods`)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyInline}>
            <span className={`${styles.emptyInlineIcon} material-symbols-outlined`}>
              sports_esports
            </span>
            <span className={styles.emptyInlineText}>
              No games detected yet. Go to Games to detect installed games.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
