import { Injectable, Inject, Logger } from '@nestjs/common';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ProviderRoute,
} from '@openclaw-club/shared';
import { RoutingService } from './routing.service';
import { AI_PROVIDERS, type IAIProvider } from './providers';

@Injectable()
export class TokenHubService {
  private readonly logger = new Logger(TokenHubService.name);

  constructor(
    private readonly routingService: RoutingService,
    @Inject(AI_PROVIDERS) private readonly providers: IAIProvider[],
  ) {}

  /**
   * Non-streaming chat completion with smart routing and failover.
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const route = this.routingService.routeRequest(request);
    const routedRequest = { ...request, model: route.model };

    try {
      const provider = this.getProvider(route.provider);
      return await provider.chatCompletion(routedRequest);
    } catch (error) {
      this.logger.warn(`Provider ${route.provider} failed, attempting failover...`);
      return this.failoverChatCompletion(routedRequest, route.provider, request.routing_strategy);
    }
  }

  /**
   * Streaming chat completion with SSE format, smart routing and failover.
   */
  async *chatCompletionStream(
    request: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const route = this.routingService.routeRequest(request);
    const routedRequest = { ...request, model: route.model };

    try {
      const provider = this.getProvider(route.provider);
      yield* provider.chatCompletionStream(routedRequest);
    } catch (error) {
      this.logger.warn(`Provider ${route.provider} stream failed, attempting failover...`);
      const fallback = this.routingService.getFailoverRoute(
        route.provider,
        request.routing_strategy,
      );
      if (!fallback) throw new Error('All providers unavailable');

      const fallbackProvider = this.getProvider(fallback.provider);
      const fallbackRequest = { ...request, model: fallback.model };
      yield* fallbackProvider.chatCompletionStream(fallbackRequest);
    }
  }

  /**
   * Get the route that would be selected for a request (for metering/billing).
   */
  getRoute(request: ChatCompletionRequest): ProviderRoute {
    return this.routingService.routeRequest(request);
  }

  private async failoverChatCompletion(
    request: ChatCompletionRequest,
    failedProvider: string,
    strategy?: ChatCompletionRequest['routing_strategy'],
  ): Promise<ChatCompletionResponse> {
    const fallback = this.routingService.getFailoverRoute(failedProvider, strategy);
    if (!fallback) {
      throw new Error('All providers unavailable');
    }

    this.logger.log(`Failing over to ${fallback.provider}/${fallback.model}`);
    const provider = this.getProvider(fallback.provider);
    return provider.chatCompletion({ ...request, model: fallback.model });
  }

  private getProvider(name: string): IAIProvider {
    const provider = this.providers.find((p) => p.name === name);
    if (!provider) throw new Error(`Provider ${name} not found`);
    return provider;
  }
}
