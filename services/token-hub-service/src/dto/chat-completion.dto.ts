import type { MessageRole, RoutingStrategy } from '@openclaw-club/shared';

export class ChatMessageDto {
  role!: MessageRole;
  content!: string;
}

export class ChatCompletionDto {
  model!: string;
  messages!: ChatMessageDto[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  routing_strategy?: RoutingStrategy;
}
