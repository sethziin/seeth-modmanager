import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { GamesPage } from '../features/games/GamesPage';
import { InstalledModsPage } from '../features/mods/InstalledModsPage';
import { BrowseModsPage } from '../features/mods/BrowseModsPage';
import { DownloadsPage } from '../features/downloads/DownloadsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { LogsPage } from '../features/logs/LogsPage';

export function AppRouter(): React.ReactElement {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:gameId/mods" element={<InstalledModsPage />} />
          <Route path="/browse" element={<BrowseModsPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
