import fs from 'node:fs';
import path from 'node:path';
import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { LogService } from './log-service';

export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description?: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly thumbnailUrl?: string;
  readonly sourceUrl: string;
  readonly packageUrl?: string;
  readonly fileSize?: number;
  readonly checksum?: string;
  readonly dependencies: readonly string[];
  readonly gameId: string;
  readonly verifiedVersion?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly rating?: number;
  readonly downloadCount?: number;
}

export interface CatalogData {
  readonly version: number;
  readonly updatedAt: string;
  readonly source: string;
  readonly checksum?: string;
  readonly entries: readonly CatalogEntry[];
}

export interface CatalogFilters {
  readonly category?: string;
  readonly gameId?: string;
  readonly tags?: readonly string[];
  readonly sortBy?: 'name' | 'updatedAt' | 'rating' | 'downloadCount';
  readonly sortOrder?: 'asc' | 'desc';
  readonly page?: number;
  readonly limit?: number;
}

export interface CatalogProvider {
  readonly id: string;
  readonly name: string;
  search(query: string, filters?: CatalogFilters): Result<readonly CatalogEntry[]>;
  getEntry(id: string): Result<CatalogEntry>;
  refresh(): Promise<Result<void>>;
}

export class LocalCatalogProvider implements CatalogProvider {
  readonly id = 'local';
  readonly name = 'Local Catalog';
  private readonly log: LogService;
  private readonly catalogPath: string;
  private catalog: CatalogData | null = null;
  private refreshAttempts = 0;

  constructor(log: LogService, catalogDir: string) {
    this.log = log;
    this.catalogPath = path.join(catalogDir, 'catalog.json');
  }

  async refresh(): Promise<Result<void>> {
    try {
      if (fs.existsSync(this.catalogPath)) {
        const raw = fs.readFileSync(this.catalogPath, 'utf-8');
        const parsed = JSON.parse(raw) as CatalogData;

        if (!parsed.entries || !Array.isArray(parsed.entries)) {
          this.fallbackToDefault();
          return ok(undefined);
        }

        this.catalog = parsed;
        this.refreshAttempts = 0;
        return ok(undefined);
      }

      this.writeDefaultCatalog();
      this.catalog = {
        version: 1,
        updatedAt: new Date().toISOString(),
        source: 'bundled',
        entries: FALLBACK_ENTRIES,
      };
      this.refreshAttempts = 0;
      return ok(undefined);
    } catch (error) {
      this.refreshAttempts++;
      this.log.error('LocalCatalogProvider', 'Failed to load catalog', error as Error);

      if (!this.catalog) {
        this.catalog = {
          version: 1,
          updatedAt: new Date().toISOString(),
          source: 'fallback',
          entries: FALLBACK_ENTRIES,
        };
      }

      return ok(undefined);
    }
  }

  search(query: string, filters?: CatalogFilters): Result<readonly CatalogEntry[]> {
    if (!this.catalog) {
      return err(createError('CONFIG_READ_FAILED', 'Catalog not loaded.', { recoverable: true }));
    }

    let results = [...this.catalog.entries];

    if (query) {
      const lower = query.toLowerCase();
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          e.author.toLowerCase().includes(lower) ||
          e.tags.some((t) => t.toLowerCase().includes(lower)) ||
          (e.description?.toLowerCase().includes(lower) ?? false),
      );
    }

    if (filters?.category) {
      results = results.filter((e) => e.category === filters.category);
    }
    if (filters?.gameId) {
      results = results.filter((e) => e.gameId === filters.gameId);
    }
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((e) => filters.tags!.some((t) => e.tags.includes(t)));
    }

    if (filters?.sortBy) {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];
        if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal) * order;
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * order;
        return 0;
      });
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const start = (page - 1) * limit;
    results = results.slice(start, start + limit);

    return ok(results);
  }

  getEntry(id: string): Result<CatalogEntry> {
    if (!this.catalog) {
      return err(createError('CONFIG_READ_FAILED', 'Catalog not loaded.', { recoverable: true }));
    }
    const entry = this.catalog.entries.find((e) => e.id === id);
    if (!entry) {
      return err(createError('MOD_NOT_FOUND', `Entry not found: ${id}`, { recoverable: false }));
    }
    return ok(entry);
  }

  getEntryCount(): number {
    return this.catalog?.entries.length ?? 0;
  }

  getSource(): string {
    return this.catalog?.source ?? 'none';
  }

  private fallbackToDefault(): void {
    this.catalog = {
      version: 1,
      updatedAt: new Date().toISOString(),
      source: 'fallback',
      entries: FALLBACK_ENTRIES,
    };
  }

  private writeDefaultCatalog(): void {
    try {
      const dir = path.dirname(this.catalogPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const defaultData: CatalogData = {
        version: 1,
        updatedAt: new Date().toISOString(),
        source: 'bundled',
        entries: FALLBACK_ENTRIES,
      };
      const tempPath = `${this.catalogPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(defaultData, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.catalogPath);
    } catch {
      // Best-effort
    }
  }
}

export class CatalogService {
  private readonly providers = new Map<string, CatalogProvider>();

  registerProvider(provider: CatalogProvider): void {
    this.providers.set(provider.id, provider);
  }

  async refreshAll(): Promise<Result<void>> {
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      await provider.refresh();
    }
    return ok(undefined);
  }

  async refreshProvider(providerId: string): Promise<Result<void>> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return err(createError('CONFIG_READ_FAILED', `Provider not found: ${providerId}`, { recoverable: false }));
    }
    return provider.refresh();
  }

  search(query: string, filters?: CatalogFilters): Result<readonly CatalogEntry[]> {
    const allResults: CatalogEntry[] = [];
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      const result = provider.search(query, filters);
      if (result.success) {
        allResults.push(...result.data);
      }
    }
    return ok(allResults);
  }

  getEntry(id: string): Result<CatalogEntry> {
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      const result = provider.getEntry(id);
      if (result.success) return result;
    }
    return err(createError('MOD_NOT_FOUND', `Entry not found in any provider: ${id}`, { recoverable: false }));
  }

  getAllGames(): Result<readonly string[]> {
    const games = new Set<string>();
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      const result = provider.search('', {});
      if (result.success) {
        for (const e of result.data) games.add(e.gameId);
      }
    }
    return ok(Array.from(games));
  }
}

const FALLBACK_ENTRIES: readonly CatalogEntry[] = [
  {
    id: 'com.razed.naturalvision',
    name: 'NaturalVision Evolved', version: '2.0.0', author: 'Razed',
    description: 'Complete visual overhaul for GTA V.',
    category: 'graphics', tags: ['visuals', 'enb', 'reshade', 'hd'],
    sourceUrl: 'https://naturalvisionevolved.com/download',
    dependencies: [], gameId: 'gtav', verifiedVersion: '1.0.877.1',
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-06-20T00:00:00Z',
    rating: 95, downloadCount: 250000,
  },
  {
    id: 'com.crosire.scripthookvdotnet', name: 'ScriptHookVDotNet', version: '3.6.0', author: 'crosire',
    description: 'ASI plugin for .NET script mods.',
    category: 'scripts', tags: ['scripts', 'asi', 'dotnet'],
    sourceUrl: 'https://github.com/crosire/scripthookvdotnet/releases',
    dependencies: ['com.dev-c.scripthookv'], gameId: 'gtav',
    createdAt: '2025-03-10T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z',
    rating: 90, downloadCount: 500000,
  },
  {
    id: 'com.gtav.chaosmod', name: 'Chaos Mod', version: '1.6.0', author: 'pongo1231',
    description: 'Randomly activates effects that change gameplay.',
    category: 'gameplay', tags: ['gameplay', 'chaos', 'randomizer'],
    sourceUrl: 'https://github.com/pongo1231/ChaosModV/releases',
    dependencies: ['com.crosire.scripthookvdotnet'], gameId: 'gtav',
    createdAt: '2025-08-05T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z',
    rating: 88, downloadCount: 150000,
  },
  {
    id: 'com.gtav.menyoos', name: 'Menyoo PC', version: '1.3.0', author: 'MAFINS',
    description: 'Advanced trainer with vehicle/ped spawning.',
    category: 'tools', tags: ['trainer', 'spawner', 'tools'],
    sourceUrl: 'https://github.com/MAFINS/MenyooPC/releases',
    dependencies: ['com.crosire.scripthookvdotnet'], gameId: 'gtav',
    createdAt: '2025-06-12T00:00:00Z', updatedAt: '2026-05-28T00:00:00Z',
    rating: 92, downloadCount: 300000,
  },
  {
    id: 'com.gtav.lspdfr', name: 'LSPD First Response', version: '0.4.9', author: 'G17 Media',
    description: 'Police roleplay mod with realistic callouts.',
    category: 'gameplay', tags: ['roleplay', 'police', 'gameplay', 'lspdfr'],
    sourceUrl: 'https://www.lcpdfr.com/downloads/gta5mods/g17media/',
    dependencies: ['com.crosire.scripthookvdotnet', 'com.dev-c.scripthookv'], gameId: 'gtav',
    verifiedVersion: '1.0.877.1',
    createdAt: '2025-04-20T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z',
    rating: 93, downloadCount: 400000,
  },
  {
    id: 'com.gtav.visualv', name: 'VisualV', version: '2.0.6', author: 'Cpolit',
    description: 'Visual enhancement mod improving lighting and shadows.',
    category: 'graphics', tags: ['visuals', 'lighting', 'shadows'],
    sourceUrl: 'https://gta5mod.net/gta-v-visualv/',
    dependencies: [], gameId: 'gtav',
    createdAt: '2025-11-01T00:00:00Z', updatedAt: '2026-05-30T00:00:00Z',
    rating: 85, downloadCount: 180000,
  },
  {
    id: 'com.gtav.simpletrainer', name: 'Simple Trainer', version: '3.5.0', author: 'sjaak327',
    description: 'Lightweight in-game trainer with vehicle and weapon options.',
    category: 'tools', tags: ['trainer', 'tools', 'lightweight'],
    sourceUrl: 'https://www.gta5-mods.com/scripts/simple-trainer-for-gtav',
    dependencies: ['com.dev-c.scripthookv'], gameId: 'gtav', verifiedVersion: '1.0.877.1',
    createdAt: '2025-02-14T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z',
    rating: 87, downloadCount: 350000,
  },
  {
    id: 'com.gtav.realtraffic', name: 'Real Traffic', version: '1.0.0', author: 'GTA5Mods Community',
    description: 'Improves traffic density and behavior.',
    category: 'gameplay', tags: ['traffic', 'ai', 'realism'],
    sourceUrl: 'https://www.gta5-mods.com/scripts/real-traffic',
    dependencies: [], gameId: 'gtav',
    createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
    rating: 78, downloadCount: 95000,
  },
];
