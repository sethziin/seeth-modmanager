import { useEffect, useState } from 'react';
import type { AppConfig } from '../../../shared/types';
import { getIpcAdapter } from '../../shared/lib/ipc-adapter';
import { Button } from '../../shared/components/Button';
import { Toggle } from '../../shared/components/Toggle';
import { Spinner } from '../../shared/components/Spinner';
import styles from './SettingsPage.module.css';

export function SettingsPage(): React.ReactElement {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void loadConfig();
  }, []);

  const loadConfig = async (): Promise<void> => {
    setLoading(true);
    try {
      const adapter = getIpcAdapter();
      const cfg = await adapter.config.get();
      setConfig(cfg);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!config) return;
    setSaving(true);
    try {
      const adapter = getIpcAdapter();
      const updated = await adapter.config.set({
        general: config.general,
        downloads: config.downloads,
        modManagement: config.modManagement,
        cache: config.cache,
        logging: config.logging,
      });
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleReset = async (): Promise<void> => {
    const adapter = getIpcAdapter();
    const cfg = await adapter.config.reset();
    setConfig(cfg);
  };

  const update = (path: string, value: unknown): void => {
    if (!config) return;
    const keys = path.split('.');
    const updated = { ...config };
    let obj: Record<string, unknown> = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i] as string;
      obj[key] = { ...(obj[key] as Record<string, unknown>) };
      obj = obj[key] as Record<string, unknown>;
    }
    obj[keys[keys.length - 1] as string] = value;
    setConfig(updated as AppConfig);
  };

  if (loading || !config) return <Spinner />;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Settings</h1>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>General</h2>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Auto-check for updates</div>
              <div className={styles.settingDescription}>
                Automatically check for mod and app updates on startup
              </div>
            </div>
            <div className={styles.settingControl}>
              <Toggle
                checked={config.general.autoCheckUpdates}
                onChange={(v) => update('general.autoCheckUpdates', v)}
              />
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Start minimized</div>
              <div className={styles.settingDescription}>
                Launch the application minimized to the system tray
              </div>
            </div>
            <div className={styles.settingControl}>
              <Toggle
                checked={config.general.startMinimized}
                onChange={(v) => update('general.startMinimized', v)}
              />
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Minimize to tray</div>
              <div className={styles.settingDescription}>
                Minimize to system tray instead of taskbar
              </div>
            </div>
            <div className={styles.settingControl}>
              <Toggle
                checked={config.general.minimizeToTray}
                onChange={(v) => update('general.minimizeToTray', v)}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Downloads</h2>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Auto-install after download</div>
              <div className={styles.settingDescription}>
                Automatically install mods after they finish downloading
              </div>
            </div>
            <div className={styles.settingControl}>
              <Toggle
                checked={config.downloads.autoInstallAfterDownload}
                onChange={(v) => update('downloads.autoInstallAfterDownload', v)}
              />
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Max concurrent downloads</div>
              <div className={styles.settingDescription}>Number of simultaneous downloads</div>
            </div>
            <div className={styles.settingControl}>
              <input
                className={styles.inputControlNarrow}
                type="number"
                min={1}
                max={10}
                value={config.downloads.maxConcurrent}
                onChange={(e) =>
                  update('downloads.maxConcurrent', Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Max retries</div>
              <div className={styles.settingDescription}>Number of download retry attempts</div>
            </div>
            <div className={styles.settingControl}>
              <input
                className={styles.inputControlNarrow}
                type="number"
                min={0}
                max={10}
                value={config.downloads.maxRetries}
                onChange={(e) =>
                  update('downloads.maxRetries', Math.max(0, parseInt(e.target.value) || 0))
                }
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Mod Management</h2>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Create backup before install</div>
              <div className={styles.settingDescription}>
                Automatically backup game files before installing mods
              </div>
            </div>
            <div className={styles.settingControl}>
              <Toggle
                checked={config.modManagement.createBackupBeforeInstall}
                onChange={(v) => update('modManagement.createBackupBeforeInstall', v)}
              />
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Show conflict warnings</div>
              <div className={styles.settingDescription}>
                Warn when installing mods that may conflict with existing ones
              </div>
            </div>
            <div className={styles.settingControl}>
              <Toggle
                checked={config.modManagement.showConflictWarnings}
                onChange={(v) => update('modManagement.showConflictWarnings', v)}
              />
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Auto-enable after install</div>
              <div className={styles.settingDescription}>
                Automatically enable mods after installation
              </div>
            </div>
            <div className={styles.settingControl}>
              <Toggle
                checked={config.modManagement.autoEnableAfterInstall}
                onChange={(v) => update('modManagement.autoEnableAfterInstall', v)}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Cache</h2>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Max cache size (MB)</div>
              <div className={styles.settingDescription}>
                Maximum cache size before automatic cleanup
              </div>
            </div>
            <div className={styles.settingControl}>
              <input
                className={styles.inputControlNarrow}
                type="number"
                min={50}
                max={2048}
                value={config.cache.maxSizeMB}
                onChange={(e) =>
                  update('cache.maxSizeMB', Math.max(50, parseInt(e.target.value) || 500))
                }
              />
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Auto cleanup after (days)</div>
              <div className={styles.settingDescription}>
                Automatically clean cache entries older than this
              </div>
            </div>
            <div className={styles.settingControl}>
              <input
                className={styles.inputControlNarrow}
                type="number"
                min={1}
                max={365}
                value={config.cache.autoCleanupDays}
                onChange={(e) =>
                  update('cache.autoCleanupDays', Math.max(1, parseInt(e.target.value) || 30))
                }
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Logging</h2>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Log level</div>
              <div className={styles.settingDescription}>Minimum log level to capture</div>
            </div>
            <div className={styles.settingControl}>
              <select
                className={styles.inputControl}
                value={config.logging.level}
                onChange={(e) => update('logging.level', e.target.value)}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Max log file size (MB)</div>
              <div className={styles.settingDescription}>Maximum size per log file</div>
            </div>
            <div className={styles.settingControl}>
              <input
                className={styles.inputControlNarrow}
                type="number"
                min={1}
                max={100}
                value={config.logging.maxFileSizeMB}
                onChange={(e) =>
                  update('logging.maxFileSizeMB', Math.max(1, parseInt(e.target.value) || 10))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        {saved && (
          <span className={styles.saved}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              check_circle
            </span>
            Saved
          </span>
        )}
        <Button variant="ghost" onClick={() => void handleReset()}>
          Reset to Defaults
        </Button>
        <Button variant="primary" icon="save" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
