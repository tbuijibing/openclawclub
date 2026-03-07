import { Injectable } from '@nestjs/common';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  routing_strategy?: 'cost_optimized' | 'speed_optimized' | 'quality_optimized';
}

interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * HTTP client for calling Token_Hub service.
 * In production, this would use HttpService from @nestjs/axios.
 */
@Injectable()
export class TokenHubClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.TOKEN_HUB_URL ?? 'http://localhost:3002';
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Token_Hub request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }
}
