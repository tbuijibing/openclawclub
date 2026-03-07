import { Injectable, Inject } from '@nestjs/common';
import type { ChatCompletionRequest, ProviderRoute, RoutingStrategy, ModelConfig } from '@openclaw-club/shared';
import { IAIProvider, AI_PROVIDERS } from './providers';

@Injectable()
export class RoutingService {
  constructor(
    @Inject(AI_PROVIDERS) private readonly providers: IAIProvider[],
  ) {}

  /**
   * Smart routing: selects the optimal model based on routing strategy.
   * - cost_optimized: picks the cheapest available model
   * - speed_optimized: picks the fastest (lowest latency) available model
   * - quality_optimized: picks the highest quality score available model
   */
  routeRequest(request: ChatCompletionRequest): ProviderRoute {
    const strategy = request.routing_strategy ?? 'quality_optimized';

    // If a specific model is requested, find it directly
    if (request.model) {
      const match = this.findSpecificModel(request.model);
      if (match) return match;
    }

    const candidates = this.getAvailableCandidates();
    if (candidates.length === 0) {
      throw new Error('No available AI providers');
    }

    return this.selectByStrategy(candidates, strategy);
  }

  /**
   * Failover: returns the next best available provider, excluding the failed one.
   */
  getFailoverRoute(failedProvider: string, strategy: RoutingStrategy = 'quality_optimized'): ProviderRoute | null {
    const candidates = this.getAvailableCandidates().filter(
      (c) => c.provider !== failedProvider,
    );
    if (candidates.length === 0) return null;
    return this.selectByStrategy(candidates, strategy);
  }

  getProviderByName(name: string): IAIProvider | undefined {
    return this.providers.find((p) => p.name === name && p.isAvailable());
  }

  private findSpecificModel(modelId: string): ProviderRoute | null {
    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;
      const model = provider.models.find((m) => m.modelId === modelId);
      if (model) {
        return this.toRoute(provider.name, model);
      }
    }
    return null;
  }

  private getAvailableCandidates(): ProviderRoute[] {
    const routes: ProviderRoute[] = [];
    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;
      for (const model of provider.models) {
        routes.push(this.toRoute(provider.name, model));
      }
    }
    return routes;
  }

  private selectByStrategy(candidates: ProviderRoute[], strategy: RoutingStrategy): ProviderRoute {
    switch (strategy) {
      case 'cost_optimized':
        return candidates.reduce((best, c) =>
          c.estimatedCostPer1kTokens < best.estimatedCostPer1kTokens ? c : best,
        );
      case 'speed_optimized':
        return candidates.reduce((best, c) =>
          c.estimatedLatencyMs < best.estimatedLatencyMs ? c : best,
        );
      case 'quality_optimized':
        return candidates.reduce((best, c) =>
          c.qualityScore > best.qualityScore ? c : best,
        );
    }
  }

  private toRoute(providerName: string, model: ModelConfig): ProviderRoute {
    return {
      provider: providerName as ProviderRoute['provider'],
      model: model.modelId,
      estimatedCostPer1kTokens: model.costPer1kPromptTokens + model.costPer1kCompletionTokens,
      estimatedLatencyMs: model.avgLatencyMs,
      qualityScore: model.qualityScore,
    };
  }
}
