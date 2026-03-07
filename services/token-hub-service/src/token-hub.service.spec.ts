import { TokenHubService } from './token-hub.service';
import { RoutingService } from './routing.service';
import { StubProvider } from './providers';
import type { ChatCompletionRequest, ModelConfig } from '@openclaw-club/shared';

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

describe('TokenHubService', () => {
  let service: TokenHubService;
  let openai: StubProvider;
  let anthropic: StubProvider;

  beforeEach(() => {
    openai = new StubProvider('openai', [
      makeModel({ modelId: 'gpt-4o', qualityScore: 95 }),
    ]);
    anthropic = new StubProvider('anthropic', [
      makeModel({ modelId: 'claude-3.5-sonnet', qualityScore: 96 }),
    ]);
    const providers = [openai, anthropic];
    const routing = new RoutingService(providers);
    service = new TokenHubService(routing, providers);
  });

  const request: ChatCompletionRequest = {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello world' }],
  };

  describe('chatCompletion', () => {
    it('should return a valid completion response', async () => {
      const result = await service.chatCompletion(request);
      expect(result.object).toBe('chat.completion');
      expect(result.choices).toHaveLength(1);
      expect(result.choices[0].message.role).toBe('assistant');
      expect(result.usage.total_tokens).toBe(
        result.usage.prompt_tokens + result.usage.completion_tokens,
      );
    });

    it('should failover when primary provider fails', async () => {
      openai.setAvailable(false);
      const result = await service.chatCompletion(request);
      // Should succeed via anthropic failover
      expect(result.object).toBe('chat.completion');
      expect(result.model).toBe('claude-3.5-sonnet');
    });

    it('should throw when all providers fail', async () => {
      openai.setAvailable(false);
      anthropic.setAvailable(false);
      await expect(service.chatCompletion(request)).rejects.toThrow();
    });
  });

  describe('chatCompletionStream', () => {
    it('should yield streaming chunks', async () => {
      const chunks: any[] = [];
      for await (const chunk of service.chatCompletionStream(request)) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].object).toBe('chat.completion.chunk');
      // Last chunk should have finish_reason 'stop'
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.choices[0].finish_reason).toBe('stop');
    });

    it('should failover stream when primary provider fails', async () => {
      openai.setAvailable(false);
      const chunks: any[] = [];
      for await (const chunk of service.chatCompletionStream(request)) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
