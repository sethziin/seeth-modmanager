import { useEffect, useState, useCallback, useMemo } from 'react';
import { getIpcAdapter } from '../../shared/lib/ipc-adapter';
import { useGameStore } from '../../shared/stores/useGameStore';
import { useModStore } from '../../shared/stores/useModStore';
import { useDownloadStore } from '../../shared/stores/useDownloadStore';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Chip } from '../../shared/components/Chip';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import styles from './BrowseModsPage.module.css';

interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description?: string;
  readonly category: string;
  readonly gameId: string;
  readonly tags: readonly string[];
  readonly sourceUrl: string;
  readonly packageUrl?: string;
  readonly checksum?: string;
  readonly rating?: number;
  readonly downloadCount?: number;
}

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'tools', label: 'Tools' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'audio', label: 'Audio' },
  { id: 'ui', label: 'UI' },
];

const ENABLED_CATALOG_MODS = [
  'com.entropic.viewpoint',
];

export function BrowseModsPage(): React.ReactElement {
  const [entries, setEntries] = useState<readonly CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const startDownload = useDownloadStore((s) => s.startDownload);
  const games = useGameStore((s) => s.games);
  const installedMods = useModStore((s) => s.mods);
  const loadInstalledMods = useModStore((s) => s.loadMods);
  const enableMod = useModStore((s) => s.enableMod);
  const disableMod = useModStore((s) => s.disableMod);

  const filterEnabled = useCallback((results: readonly CatalogEntry[]): readonly CatalogEntry[] => {
    return results.filter((e) => ENABLED_CATALOG_MODS.includes(e.id));
  }, []);

  const activeGameId = useMemo(() => {
    const gameWithPath = games.find((g) => g.installPath);
    return gameWithPath?.id ?? 'gtav';
  }, [games]);

  useEffect(() => {
    void loadInstalledMods(activeGameId);
  }, [loadInstalledMods, activeGameId]);

  const getModState = useCallback(
    (entry: CatalogEntry): 'not-installed' | 'installed' | 'disabled' => {
      const installed = installedMods.find((m) => m.name === entry.name);
      if (!installed) return 'not-installed';
      return installed.enabled ? 'installed' : 'disabled';
    },
    [installedMods],
  );

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const adapter = getIpcAdapter();
      const results = await adapter.catalog.search('', { category: category || undefined, limit: 100 });
      setEntries(filterEnabled(results as readonly CatalogEntry[]));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [category, filterEnabled]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const adapter = getIpcAdapter();
      const results = await adapter.catalog.search(search, { category: category || undefined, limit: 100 });
      setEntries(filterEnabled(results as readonly CatalogEntry[]));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, filterEnabled]);

  const handleDownload = useCallback(
    async (entry: CatalogEntry) => {
      const url = entry.packageUrl || entry.sourceUrl;

      if (!entry.packageUrl) {
        window.open(url, '_blank');
        return;
      }

      try {
        await startDownload(url, {
          modName: entry.name,
          modVersion: entry.version,
          gameId: entry.gameId,
          autoInstall: true,
          catalogEntryId: entry.id,
          expectedChecksum: entry.checksum,
        });
      } catch {
        // Error toast handled by store
      }
    },
    [startDownload],
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Browse Mods</h1>

      <div className={styles.toolbar}>
        <Input
          placeholder="Search mods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
          icon="search"
        />
        <Button variant="primary" icon="search" onClick={() => void handleSearch()}>
          Search
        </Button>
      </div>

      <div className={styles.filterBar}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            active={category === cat.id}
            onClick={() => {
              setCategory(cat.id);
              void loadCatalog();
            }}
          />
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && entries.length === 0 && (
        <EmptyState
          icon="explore"
          title="No Mods Found"
          description={search ? 'Try a different search term.' : 'No mods available in the catalog.'}
        />
      )}

      {!loading && entries.length > 0 && (
        <div className={styles.modGrid}>
          {entries.map((entry) => (
            <div key={entry.id} className={styles.modCard}>
              <div className={styles.modCardHeader}>
                <div className={styles.modName}>{entry.name}</div>
                <span className={styles.modVersion}>v{entry.version}</span>
              </div>
              <div className={styles.modAuthor}>{entry.author}</div>
              {entry.description && (
                <div className={styles.modDescription}>{entry.description}</div>
              )}
              <div className={styles.modMeta}>
                <span className={styles.modCategory}>{entry.category}</span>
                {entry.rating !== undefined && (
                  <span className={styles.modRating}>★ {entry.rating}</span>
                )}
                {entry.downloadCount !== undefined && (
                  <span className={styles.modDownloads}>
                    {entry.downloadCount.toLocaleString()} downloads
                  </span>
                )}
              </div>
              <div className={styles.modTags}>
                {entry.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className={styles.modTag}>{tag}</span>
                ))}
              </div>
              <div className={styles.modActions}>
                {(() => {
                  const state = getModState(entry);
                  if (state === 'installed') {
                    return (
                      <Button variant="secondary" size="sm" disabled>
                        Installed
                      </Button>
                    );
                  }
                  if (state === 'disabled') {
                    return (
                      <Button variant="primary" size="sm" icon="check" onClick={() => void enableMod(activeGameId, installedMods.find((m) => m.name === entry.name)!.id)}>
                        Enable
                      </Button>
                    );
                  }
                  return (
                    <Button variant="primary" size="sm" icon="download" onClick={() => void handleDownload(entry)}>
                      {entry.packageUrl ? 'Download & Install' : 'Open Page'}
                    </Button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
