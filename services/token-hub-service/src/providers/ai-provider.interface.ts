import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  AIProvider,
  ModelConfig,
} from '@openclaw-club/shared';

/**
 * Interface that all AI model providers must implement.
 * Each provider adapts the unified OpenAI-compatible request format
 * to the provider's native API.
 */
export interface IAIProvider {
  readonly name: AIProvider;
  readonly models: ModelConfig[];

  /** Check if the provider is currently available */
  isAvailable(): boolean;

  /** Send a non-streaming chat completion request */
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /** Send a streaming chat completion request, yielding SSE chunks */
  chatCompletionStream(
    request: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionChunk, void, unknown>;
}

/** Token for DI injection of provider array */
export const AI_PROVIDERS = Symbol('AI_PROVIDERS');
