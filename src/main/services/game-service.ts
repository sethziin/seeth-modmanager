import type { Result } from '../../shared/types';
import { ok, err } from '../../shared/types';
import { createError } from '../../shared/types/error';
import type { GameProvider } from '../../shared/types/provider';
import type { DetectedGame, GameDetails } from '../../shared/types/game';
import type { LogService } from './log-service';
import type { ConfigService } from './config-service';
import type { FileSystemService } from './filesystem-service';

export class GameService {
  private readonly providers = new Map<string, GameProvider>();
  private readonly log: LogService;
  private readonly config: ConfigService;
  private readonly fileSystem: FileSystemService;

  constructor(log: LogService, config: ConfigService, fileSystem: FileSystemService) {
    this.log = log;
    this.config = config;
    this.fileSystem = fileSystem;
  }

  registerProvider(provider: GameProvider): void {
    this.providers.set(provider.id, provider);
    this.log.info('GameService', `Registered provider: ${provider.name}`, {
      id: provider.id,
    });
  }

  getProvider(gameId: string): GameProvider | undefined {
    return this.providers.get(gameId);
  }

  getAllProviders(): readonly GameProvider[] {
    return Array.from(this.providers.values());
  }

  async detectAllGames(): Promise<Result<readonly DetectedGame[]>> {
    const detectedGames: DetectedGame[] = [];

    for (const provider of Array.from(this.providers.values())) {
      try {
        const installation = await provider.detectInstallation();
        if (installation) {
          detectedGames.push({
            id: provider.id,
            name: provider.name,
            shortName: provider.shortName,
            slug: provider.slug,
            installPath: installation.path,
            platform: installation.platform,
            detectedAt: new Date().toISOString(),
            coverUrl: provider.coverUrl,
          });
        }
      } catch (error) {
        this.log.error('GameService', `Failed to detect ${provider.name}`, error as Error);
      }
    }

    return ok(detectedGames);
  }

  async getGameDetails(gameId: string): Promise<Result<GameDetails>> {
    const provider = this.providers.get(gameId);
    if (!provider) {
      return err(
        createError('GAME_NOT_FOUND', `Game provider not found: ${gameId}`, {
          recoverable: false,
        }),
      );
    }

    const registryResult = this.config.getGameRegistry();
    if (!registryResult.success) {
      return err(registryResult.error);
    }

    const registryEntry = registryResult.data.games[gameId];
    if (!registryEntry) {
      return err(
        createError('GAME_NOT_FOUND', `Game not registered: ${gameId}`, {
          recoverable: true,
          suggestion: 'Run game detection first',
        }),
      );
    }

    const gameVersion = await provider.getGameVersion(registryEntry.installPath);

    const modRegistryResult = this.config.getModRegistry(gameId);
    const modCount = modRegistryResult.success ? modRegistryResult.data.mods.length : 0;
    const enabledModCount = modRegistryResult.success
      ? modRegistryResult.data.mods.filter((m) => m.enabled).length
      : 0;

    return ok({
      id: gameId,
      name: provider.name,
      shortName: provider.shortName,
      slug: provider.slug,
      installPath: registryEntry.installPath,
      platform: registryEntry.platform as DetectedGame['platform'],
      gameVersion,
      detectedAt: registryEntry.detectedAt,
      lastPlayed: registryEntry.lastPlayed,
      configured: registryEntry.configured,
      modCount,
      enabledModCount,
    });
  }

  async saveGameInstallation(
    gameId: string,
    installPath: string,
    platform: string,
  ): Promise<Result<void>> {
    const registryResult = this.config.getGameRegistry();
    if (!registryResult.success) {
      return err(registryResult.error);
    }

    const registry = {
      ...registryResult.data,
      games: {
        ...registryResult.data.games,
        [gameId]: {
          name: this.providers.get(gameId)?.name ?? gameId,
          installPath,
          platform,
          detectedAt: new Date().toISOString(),
          gameVersion: 'unknown',
          configured: true,
        },
      },
    };

    return this.config.writeGameRegistry(registry);
  }
}
