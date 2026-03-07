import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  AIProvider,
  ModelConfig,
} from '@openclaw-club/shared';
import type { IAIProvider } from './ai-provider.interface';

/**
 * A stub AI provider for development/testing.
 * Returns deterministic mock responses without calling real APIs.
 */
export class StubProvider implements IAIProvider {
  private available = true;

  constructor(
    public readonly name: AIProvider,
    public readonly models: ModelConfig[],
  ) {}

  isAvailable(): boolean {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.available) {
      throw new Error(`Provider ${this.name} is currently unavailable`);
    }

    const promptText = request.messages.map((m) => m.content).join(' ');
    const promptTokens = Math.ceil(promptText.length / 4);
    const completionTokens = Math.ceil(promptTokens * 0.8);

    return {
      id: `chatcmpl-stub-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `[Stub ${this.name}] Response to: ${promptText.slice(0, 50)}...`,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };
  }

  async *chatCompletionStream(
    request: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    if (!this.available) {
      throw new Error(`Provider ${this.name} is currently unavailable`);
    }

    const responseText = `[Stub ${this.name}] Streaming response`;
    const words = responseText.split(' ');
    const id = `chatcmpl-stub-${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);

    for (const word of words) {
      yield {
        id,
        object: 'chat.completion.chunk',
        created,
        model: request.model,
        choices: [
          {
            index: 0,
            delta: { content: word + ' ' },
            finish_reason: null,
          },
        ],
      };
    }

    // Final chunk with finish_reason
    yield {
      id,
      object: 'chat.completion.chunk',
      created,
      model: request.model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'stop',
        },
      ],
    };
  }
}
