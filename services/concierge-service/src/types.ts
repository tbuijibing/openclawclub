// Re-export shared types used by concierge service
export type {
  ConversationStatus,
  ConversationScenario,
  RichElement,
  RichElementType,
  SuggestedAction,
  ServiceRequirements,
  ServicePlanCard,
  CreateSessionDto,
  SendMessageDto,
  AIResponse,
  EscalateRequest,
  EscalationResult,
} from '@openclaw-club/shared';

export type { SupportedLanguage } from '@openclaw-club/shared';
export type { ChatCompletionRequest, ChatCompletionResponse, ChatMessage } from '@openclaw-club/shared';
