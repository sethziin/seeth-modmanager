import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useModStore } from '../../shared/stores/useModStore';
import { useGameStore } from '../../shared/stores/useGameStore';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Chip } from '../../shared/components/Chip';
import { ModCard } from '../../shared/components/ModCard';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import { Modal } from '../../shared/components/Modal';
import styles from './ModsPage.module.css';
import type { ModCategory } from '../../../shared/types';

const CATEGORIES: readonly ModCategory[] = [
  { id: 'gameplay', name: 'Gameplay', icon: 'sports_esports' },
  { id: 'graphics', name: 'Graphics', icon: 'palette' },
  { id: 'audio', name: 'Audio', icon: 'volume_up' },
  { id: 'vehicles', name: 'Vehicles', icon: 'directions_car' },
  { id: 'weapons', name: 'Weapons', icon: 'local_fire_department' },
  { id: 'scripts', name: 'Scripts', icon: 'code' },
  { id: 'ui', name: 'UI', icon: 'web' },
  { id: 'maps', name: 'Maps', icon: 'map' },
  { id: 'misc', name: 'Misc', icon: 'category' },
];

export function InstalledModsPage(): React.ReactElement {
  const { gameId } = useParams<{ gameId: string }>();
  const { mods, loading, error, filter, loadMods, setFilter, uninstallMod, enableMod, disableMod } =
    useModStore();
  const { selectedGame, selectGame } = useGameStore();
  const [uninstallTarget, setUninstallTarget] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      void loadMods(gameId);
      if (!selectedGame || selectedGame.id !== gameId) {
        void selectGame(gameId);
      }
    }
  }, [gameId, loadMods, selectGame, selectedGame]);

  const filteredMods = mods.filter((mod) => {
    if (filter.category && mod.category.id !== filter.category.id) return false;
    if (filter.enabled !== null && mod.enabled !== filter.enabled) return false;
    if (filter.search && !mod.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const handleUninstall = async (): Promise<void> => {
    if (gameId && uninstallTarget) {
      await uninstallMod(gameId, uninstallTarget);
      setUninstallTarget(null);
    }
  };

  const handleToggle = async (modId: string, enabled: boolean): Promise<void> => {
    if (!gameId) return;
    if (enabled) {
      await enableMod(gameId, modId);
    } else {
      await disableMod(gameId, modId);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>
        {selectedGame ? `${selectedGame.name} - Mods` : 'Installed Mods'}
      </h1>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Input
            icon="search"
            placeholder="Search mods..."
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <div className={styles.toolbarRight}>
          <Button
            variant="ghost"
            size="sm"
            icon="filter_alt_off"
            onClick={() => setFilter({ category: null, enabled: null, search: '' })}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className={styles.filterBar}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            icon={cat.icon}
            active={filter.category?.id === cat.id}
            onClick={() =>
              setFilter({ category: filter.category?.id === cat.id ? null : cat })
            }
          />
        ))}
      </div>

      <div className={styles.filterBar}>
        <Chip
          label="Enabled"
          active={filter.enabled === true}
          onClick={() => setFilter({ enabled: filter.enabled === true ? null : true })}
        />
        <Chip
          label="Disabled"
          active={filter.enabled === false}
          onClick={() => setFilter({ enabled: filter.enabled === false ? null : false })}
        />
      </div>

      <div className={styles.modCount}>
        {filteredMods.length} mod{filteredMods.length !== 1 ? 's' : ''}
        {filter.search || filter.category || filter.enabled !== null ? ' (filtered)' : ''}
      </div>

      {loading && <Spinner />}

      {!loading && filteredMods.length === 0 && (
        <EmptyState
          icon="inventory_2"
          title={mods.length === 0 ? 'No Mods Installed' : 'No Matching Mods'}
          description={
            mods.length === 0
              ? 'Install mods by dragging archives into the app or using the Browse Mods page.'
              : 'Try adjusting your search or filters.'
          }
        />
      )}

      {!loading && (
        <div className={styles.modList}>
          {filteredMods.map((mod) => (
            <ModCard
              key={mod.id}
              name={mod.name}
              author={mod.author}
              description={mod.description}
              version={mod.version}
              category={mod.category.name}
              installed
              onUpdate={() => {}}
              onUninstall={() => setUninstallTarget(mod.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={uninstallTarget !== null}
        onClose={() => setUninstallTarget(null)}
        title="Uninstall Mod"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUninstallTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleUninstall()}>
              Uninstall
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-on-surface)' }}>
          Are you sure you want to uninstall this mod? This action cannot be undone.
        </p>
      </Modal>

      {error && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            right: 16,
            background: 'var(--color-error)',
            color: 'var(--color-on-primary)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
