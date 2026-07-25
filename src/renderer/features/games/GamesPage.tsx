import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../shared/stores/useGameStore';
import { Button } from '../../shared/components/Button';
import { GameCard } from '../../shared/components/GameCard';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import styles from './GamesPage.module.css';

export function GamesPage(): React.ReactElement {
  const navigate = useNavigate();
  const { games, loading, error, loadGames, selectGame, selectedGame, setGameDirectory } =
    useGameStore();
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const handleDetect = async (): Promise<void> => {
    setDetecting(true);
    await loadGames();
    setDetecting(false);
  };

  const handleSelectGame = async (gameId: string): Promise<void> => {
    await selectGame(gameId);
  };

  const handleSetDirectory = async (gameId: string): Promise<void> => {
    const path = await window.electronAPI.fs.selectDirectory('Select Game Directory');
    if (path) {
      await setGameDirectory(gameId, path);
    }
  };

  const handleGameCardClick = (slug: string): void => {
    const game = games.find((g) => g.slug === slug);
    if (game) {
      void handleSelectGame(game.id);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Games</h1>

      <div className={styles.toolbar}>
        <Button
          variant="primary"
          icon="search"
          onClick={() => void handleDetect()}
          disabled={detecting}
        >
          {detecting ? 'Detecting...' : 'Detect Games'}
        </Button>
        <Button
          variant="secondary"
          icon="folder_open"
          onClick={() => {
            if (selectedGame) void handleSetDirectory(selectedGame.id);
          }}
          disabled={!selectedGame}
        >
          Set Directory
        </Button>
      </div>

      {error && (
        <div className={styles.detailCard} style={{ marginBottom: 16, color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {(loading || detecting) && <Spinner />}

      {!loading && !detecting && games.length === 0 && (
        <EmptyState
          icon="videogame_asset"
          title="No Games Detected"
          description='Click "Detect Games" to scan your system for supported games, or manually add a game directory.'
        />
      )}

      {!loading && !detecting && games.length > 0 && (
        <div style={{ display: 'flex', gap: 24 }}>
          <div className={styles.gameGrid} style={{ flex: selectedGame ? '0 0 400px' : '1' }}>
            {games.map((game) => (
              <GameCard
                key={game.id}
                name={game.name}
                slug={game.slug}
                coverUrl={game.coverUrl}
                active={selectedGame?.id === game.id}
                onClick={handleGameCardClick}
              />
            ))}
          </div>

          {selectedGame && (
            <div className={styles.gameDetail} style={{ flex: 1 }}>
              <div className={styles.detailCard}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name</span>
                  <span className={styles.detailValue}>{selectedGame.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Platform</span>
                  <span className={styles.detailValue}>{selectedGame.platform}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Version</span>
                  <span className={styles.detailValue}>{selectedGame.gameVersion}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Install Path</span>
                  <span className={styles.detailValue} style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {selectedGame.installPath}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Installed Mods</span>
                  <span className={styles.detailValue}>{selectedGame.modCount}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Enabled Mods</span>
                  <span className={styles.detailValue}>{selectedGame.enabledModCount}</span>
                </div>
                <div className={styles.detailActions}>
                  <Button
                    variant="primary"
                    icon="folder_open"
                    size="sm"
                    onClick={() => void handleSetDirectory(selectedGame.id)}
                  >
                    Change Directory
                  </Button>
                  <Button
                    variant="secondary"
                    icon="sports_esports"
                    size="sm"
                    onClick={() => navigate(`/games/${selectedGame.id}/mods`)}
                  >
                    Manage Mods
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
