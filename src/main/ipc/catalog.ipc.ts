import { ipcMain } from 'electron';
import type { CatalogService } from '../services/catalog-service';
import type { RemoteCatalogProvider } from '../providers/remote-catalog.provider';

export function registerCatalogIpcHandlers(
  catalog: CatalogService,
  remoteCatalog?: RemoteCatalogProvider,
): void {
  ipcMain.handle('catalog:search', async (_event, query: string, filters?: Record<string, unknown>) => {
    const result = catalog.search(query, filters as any);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });

  ipcMain.handle('catalog:get-entry', async (_event, id: string) => {
    const result = catalog.getEntry(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });

  ipcMain.handle('catalog:get-games', async () => {
    const result = catalog.getAllGames();
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });

  ipcMain.handle('catalog:refresh', async () => {
    if (!remoteCatalog) {
      return false;
    }
    const result = await remoteCatalog.sync();
    if (result.success && result.data) {
      await catalog.refreshAll();
    }
    return result.success && result.data;
  });
}
