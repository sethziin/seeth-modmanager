import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import styles from './SideNav.module.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/games', label: 'Games', icon: 'videogame_asset' },
  { path: '/browse', label: 'Browse Mods', icon: 'explore' },
  { path: '/downloads', label: 'Downloads', icon: 'download' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
  { path: '/logs', label: 'Logs', icon: 'terminal' },
];

export function SideNav(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ gameId?: string }>();
  const { games, loadGames } = useGameStore();

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const activeGameId = params.gameId ?? null;

  return (
    <aside className={styles.sideNav}>
      <div className={styles.header}>
        <img className={styles.appIcon} src="/seethmodmanager-logo.jpg" alt="Seeth's Mod Manager" />
        <div className={styles.appName}>Seeth's Mod Manager</div>
        <div className={styles.appVersion}>v1.0.0</div>
      </div>

      <nav className={styles.navSection}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            className={`${styles.navItem} ${isActive(item.path) ? styles.navItemActive : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.navIcon}>
              <span className="material-symbols-outlined">{item.icon}</span>
            </span>
            {item.label}
          </button>
        ))}

        {games.length > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.sectionLabel}>Detected Games</div>
            {games.map((game) => (
              <button
                key={game.id}
                className={`${styles.gameItem} ${activeGameId === game.id ? styles.gameItemActive : ''}`}
                onClick={() => navigate(`/games/${game.id}/mods`)}
              >
                <span className={styles.gameIcon}>
                  <span className="material-symbols-outlined">sports_esports</span>
                </span>
                {game.name}
              </button>
            ))}
          </>
        )}
      </nav>

      <div className={styles.footer}>
        <button className={styles.footerLink}>
          <span className="material-symbols-outlined">help</span>
          Support
        </button>
        <button className={styles.footerLink}>
          <span className="material-symbols-outlined">policy</span>
          Legal
        </button>
      </div>
    </aside>
  );
}
