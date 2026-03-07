import type { ModelConfig, AIProvider } from '@openclaw-club/shared';
import { StubProvider } from './stub-provider';
import type { IAIProvider } from './ai-provider.interface';

/** Default model configurations with pricing and performance metadata */
const MODEL_CONFIGS: Record<AIProvider, ModelConfig[]> = {
  openai: [
    {
      modelId: 'gpt-4o',
      costPer1kPromptTokens: 0.0025,
      costPer1kCompletionTokens: 0.01,
      pricePer1kPromptTokens: 0.005,
      pricePer1kCompletionTokens: 0.015,
      avgLatencyMs: 800,
      qualityScore: 95,
    },
    {
      modelId: 'gpt-4o-mini',
      costPer1kPromptTokens: 0.00015,
      costPer1kCompletionTokens: 0.0006,
      pricePer1kPromptTokens: 0.0003,
      pricePer1kCompletionTokens: 0.001,
      avgLatencyMs: 400,
      qualityScore: 82,
    },
  ],
  anthropic: [
    {
      modelId: 'claude-3.5-sonnet',
      costPer1kPromptTokens: 0.003,
      costPer1kCompletionTokens: 0.015,
      pricePer1kPromptTokens: 0.005,
      pricePer1kCompletionTokens: 0.02,
      avgLatencyMs: 900,
      qualityScore: 96,
    },
    {
      modelId: 'claude-3-haiku',
      costPer1kPromptTokens: 0.00025,
      costPer1kCompletionTokens: 0.00125,
      pricePer1kPromptTokens: 0.0005,
      pricePer1kCompletionTokens: 0.002,
      avgLatencyMs: 300,
      qualityScore: 78,
    },
  ],
  google: [
    {
      modelId: 'gemini-1.5-pro',
      costPer1kPromptTokens: 0.00125,
      costPer1kCompletionTokens: 0.005,
      pricePer1kPromptTokens: 0.0025,
      pricePer1kCompletionTokens: 0.0075,
      avgLatencyMs: 700,
      qualityScore: 90,
    },
    {
      modelId: 'gemini-1.5-flash',
      costPer1kPromptTokens: 0.000075,
      costPer1kCompletionTokens: 0.0003,
      pricePer1kPromptTokens: 0.00015,
      pricePer1kCompletionTokens: 0.0006,
      avgLatencyMs: 250,
      qualityScore: 75,
    },
  ],
  deepseek: [
    {
      modelId: 'deepseek-chat',
      costPer1kPromptTokens: 0.00014,
      costPer1kCompletionTokens: 0.00028,
      pricePer1kPromptTokens: 0.0003,
      pricePer1kCompletionTokens: 0.0006,
      avgLatencyMs: 500,
      qualityScore: 85,
    },
  ],
};

/**
 * Creates the default set of stub providers for all supported AI providers.
 * In production, these would be replaced with real SDK-based implementations.
 */
export function createDefaultProviders(): IAIProvider[] {
  return (Object.keys(MODEL_CONFIGS) as AIProvider[]).map(
    (provider) => new StubProvider(provider, MODEL_CONFIGS[provider]),
  );
}

export { MODEL_CONFIGS };
