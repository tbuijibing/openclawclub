import { RoutingService } from './routing.service';
import { StubProvider } from './providers';
import type { ModelConfig, AIProvider, ChatCompletionRequest } from '@openclaw-club/shared';

function makeModel(overrides: Partial<ModelConfig> & { modelId: string }): ModelConfig {
  return {
    costPer1kPromptTokens: 0.01,
    costPer1kCompletionTokens: 0.02,
    pricePer1kPromptTokens: 0.02,
    pricePer1kCompletionTokens: 0.04,
    avgLatencyMs: 500,
    qualityScore: 80,
    ...overrides,
  };
}

function makeProvider(name: AIProvider, models: ModelConfig[], available = true): StubProvider {
  const p = new StubProvider(name, models);
  p.setAvailable(available);
  return p;
}

function makeRequest(overrides: Partial<ChatCompletionRequest> = {}): ChatCompletionRequest {
  return {
    model: '',
    messages: [{ role: 'user', content: 'Hello' }],
    ...overrides,
  };
}

describe('RoutingService', () => {
  let service: RoutingService;
  let openai: StubProvider;
  let anthropic: StubProvider;
  let google: StubProvider;

  beforeEach(() => {
    openai = makeProvider('openai', [
      makeModel({ modelId: 'gpt-4o', costPer1kPromptTokens: 0.005, avgLatencyMs: 800, qualityScore: 95 }),
      makeModel({ modelId: 'gpt-4o-mini', costPer1kPromptTokens: 0.0001, avgLatencyMs: 400, qualityScore: 82 }),
    ]);
    anthropic = makeProvider('anthropic', [
      makeModel({ modelId: 'claude-3.5-sonnet', costPer1kPromptTokens: 0.003, avgLatencyMs: 900, qualityScore: 96 }),
    ]);
    google = makeProvider('google', [
      makeModel({ modelId: 'gemini-1.5-flash', costPer1kPromptTokens: 0.00007, avgLatencyMs: 250, qualityScore: 75 }),
    ]);
    service = new RoutingService([openai, anthropic, google]);
  });

  it('should route to specific model when requested', () => {
    const route = service.routeRequest(makeRequest({ model: 'claude-3.5-sonnet' }));
    expect(route.provider).toBe('anthropic');
    expect(route.model).toBe('claude-3.5-sonnet');
  });

  it('should pick cheapest model for cost_optimized strategy', () => {
    const route = service.routeRequest(makeRequest({ routing_strategy: 'cost_optimized' }));
    expect(route.model).toBe('gemini-1.5-flash');
  });

  it('should pick fastest model for speed_optimized strategy', () => {
    const route = service.routeRequest(makeRequest({ routing_strategy: 'speed_optimized' }));
    expect(route.model).toBe('gemini-1.5-flash');
  });

  it('should pick highest quality model for quality_optimized strategy', () => {
    const route = service.routeRequest(makeRequest({ routing_strategy: 'quality_optimized' }));
    expect(route.model).toBe('claude-3.5-sonnet');
  });

  it('should default to quality_optimized when no strategy specified', () => {
    const route = service.routeRequest(makeRequest());
    expect(route.qualityScore).toBe(96);
  });

  it('should skip unavailable providers', () => {
    anthropic.setAvailable(false);
    const route = service.routeRequest(makeRequest({ routing_strategy: 'quality_optimized' }));
    expect(route.provider).not.toBe('anthropic');
    expect(route.model).toBe('gpt-4o');
  });

  it('should throw when no providers available', () => {
    openai.setAvailable(false);
    anthropic.setAvailable(false);
    google.setAvailable(false);
    expect(() => service.routeRequest(makeRequest())).toThrow('No available AI providers');
  });

  it('should return failover route excluding failed provider', () => {
    const route = service.getFailoverRoute('anthropic', 'quality_optimized');
    expect(route).not.toBeNull();
    expect(route!.provider).not.toBe('anthropic');
  });

  it('should return null failover when no alternatives', () => {
    anthropic.setAvailable(false);
    google.setAvailable(false);
    const route = service.getFailoverRoute('openai');
    expect(route).toBeNull();
  });
});
