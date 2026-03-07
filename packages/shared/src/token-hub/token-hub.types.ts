/** AI model providers */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'deepseek';

/** Routing strategies for smart routing */
export type RoutingStrategy = 'cost_optimized' | 'speed_optimized' | 'quality_optimized';

/** Billing modes for Token accounts */
export type BillingMode = 'pay_as_you_go' | 'monthly' | 'yearly';

/** Chat message role */
export type MessageRole = 'system' | 'user' | 'assistant';

/** Chat message */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** OpenAI-compatible chat completion request */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  /** Token_Hub extension: routing strategy */
  routing_strategy?: RoutingStrategy;
}

/** OpenAI-compatible chat completion response */
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** SSE streaming chunk */
export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: Partial<ChatMessage>;
  finish_reason: string | null;
}

/** Token usage record for metering */
export interface TokenUsage {
  provider: AIProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  priceUsd: number;
  timestamp: string;
}

/** Provider route result from smart routing */
export interface ProviderRoute {
  provider: AIProvider;
  model: string;
  estimatedCostPer1kTokens: number;
  estimatedLatencyMs: number;
  qualityScore: number;
}

/** Provider configuration */
export interface ProviderConfig {
  provider: AIProvider;
  models: ModelConfig[];
  isAvailable: boolean;
}

export interface ModelConfig {
  modelId: string;
  costPer1kPromptTokens: number;
  costPer1kCompletionTokens: number;
  pricePer1kPromptTokens: number;
  pricePer1kCompletionTokens: number;
  avgLatencyMs: number;
  qualityScore: number;
}
