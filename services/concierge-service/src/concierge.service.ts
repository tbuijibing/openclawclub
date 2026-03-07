import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConversationScenario, ServiceRequirements, ServicePlanCard, AIResponse, RichElement, EscalationResult } from './types';
import { getSystemPrompt, detectLanguage, SUPPORTED_LANGUAGES } from './system-prompts';
import { TokenHubClient } from './token-hub.client';
import { extractRequirements, getMissingFields, hasMinimumRequirements, recommendTier, FIELD_LABELS } from './requirements-collector';

export interface SessionRecord {
  id: string;
  userId: string;
  language: string;
  scenario: ConversationScenario;
  status: 'active' | 'escalated' | 'closed';
  escalatedToAgentId?: string;
  collectedRequirements: Partial<ServiceRequirements>;
  generatedPlan?: ServicePlanCard;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; richElements?: RichElement[] }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfirmOrderResult {
  sessionId: string;
  userId: string;
  orderId: string;
  installOrderId: string;
  serviceTier: string;
  price: number;
  currency: string;
  collectedRequirements: Partial<ServiceRequirements>;
  status: 'order_created';
}

@Injectable()
export class ConciergeService {
  private sessions = new Map<string, SessionRecord>();
  constructor(private readonly tokenHubClient: TokenHubClient) {}

  createSession(userId: string, language?: string, scenario?: ConversationScenario): SessionRecord {
    const resolvedLang = language && SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
    const resolvedScenario = scenario ?? 'general';
    const id = this.generateId();
    const systemPrompt = getSystemPrompt(resolvedScenario, resolvedLang);
    const session: SessionRecord = {
      id, userId, language: resolvedLang, scenario: resolvedScenario,
      status: 'active', collectedRequirements: {},
      messages: [{ role: 'system', content: systemPrompt }],
      createdAt: new Date(), updatedAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async sendMessage(sessionId: string, content: string): Promise<AIResponse> {
    const session = this.getSession(sessionId);
    if (session.status !== 'active') {
      throw new BadRequestException(`Session ${sessionId} is ${session.status}, cannot send messages`);
    }
    const detectedLang = detectLanguage(content);
    if (detectedLang !== session.language && SUPPORTED_LANGUAGES.includes(detectedLang)) {
      session.language = detectedLang;
      session.messages[0] = { role: 'system', content: getSystemPrompt(session.scenario, detectedLang) };
    }
    session.messages.push({ role: 'user', content });
    if (session.scenario === 'installation') {
      const newlyCollected = extractRequirements(content, session.collectedRequirements);
      if (Object.keys(newlyCollected).length > 0) {
        session.collectedRequirements = { ...session.collectedRequirements, ...newlyCollected };
      }
    }
    const chatMessages = session.messages.map((m) => ({ role: m.role, content: m.content }));
    const completion = await this.tokenHubClient.chatCompletion({
      model: 'gpt-4o', messages: chatMessages, temperature: 0.7, routing_strategy: 'quality_optimized',
    });
    const assistantContent = completion.choices[0]?.message?.content ?? '';
    const { richElements, needsEscalation } = this.parseResponse(assistantContent);
    if (session.scenario === 'installation') {
      const fromAI = extractRequirements(assistantContent, session.collectedRequirements);
      if (Object.keys(fromAI).length > 0) {
        session.collectedRequirements = { ...session.collectedRequirements, ...fromAI };
      }
    }
    session.messages.push({ role: 'assistant', content: assistantContent, richElements });
    session.updatedAt = new Date();
    return {
      content: assistantContent, richElements,
      suggestedActions: this.getSuggestedActions(session),
      needsEscalation, collectedInfo: session.collectedRequirements,
    };
  }

  generateServicePlan(sessionId: string): ServicePlanCard {
    const session = this.getSession(sessionId);
    const reqs = session.collectedRequirements;
    if (!hasMinimumRequirements(reqs)) {
      const missing = getMissingFields(reqs);
      const lang = session.language || 'en';
      const labels = missing.map((f) => FIELD_LABELS[f][lang] || FIELD_LABELS[f].en);
      throw new BadRequestException('Not enough requirements collected. Still missing: ' + labels.join(', '));
    }
    const tier = recommendTier(reqs);
    const plan = this.buildPlanCard(tier);
    session.generatedPlan = plan;
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
    const planMsg = 'Based on your requirements, I recommend the ' + tierLabel + ' Installation Package ($' + plan.price + '). Warranty: ' + plan.warrantyDays + ' days. Estimated duration: ' + plan.estimatedDuration + ' minutes. You can confirm to place the order.';
    session.messages.push({
      role: 'assistant', content: planMsg,
      richElements: [{ type: 'service_plan_card', data: plan as unknown as Record<string, unknown> }],
    });
    session.updatedAt = new Date();
    return plan;
  }

  confirmOrder(sessionId: string): ConfirmOrderResult {
    const session = this.getSession(sessionId);
    if (!session.generatedPlan) {
      throw new BadRequestException('No service plan has been generated. Call generateServicePlan first.');
    }
    const plan = session.generatedPlan;
    const orderId = 'ord-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    const installOrderId = 'inst-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    session.messages.push({
      role: 'assistant',
      content: 'Order confirmed! Your ' + plan.tier + ' installation order has been created (Order: ' + orderId + ').',
      richElements: [{ type: 'card', data: { title: 'Order Confirmed', orderId, tier: plan.tier, price: plan.price, currency: plan.currency, status: 'pending_payment' } }],
    });
    session.updatedAt = new Date();
    return {
      sessionId, userId: session.userId, orderId, installOrderId,
      serviceTier: plan.tier, price: plan.price, currency: plan.currency,
      collectedRequirements: session.collectedRequirements, status: 'order_created',
    };
  }

  escalateToHuman(sessionId: string, reason: string): EscalationResult {
    const session = this.getSession(sessionId);
    if (session.status === 'escalated') {
      throw new BadRequestException('Session already escalated');
    }
    const agentId = this.findAvailableAgent();
    session.status = 'escalated';
    session.escalatedToAgentId = agentId;
    session.updatedAt = new Date();
    const conversationHistory = session.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));
    return {
      sessionId, agentId, reason, language: session.language, scenario: session.scenario, conversationHistory,
      collectedRequirements: Object.keys(session.collectedRequirements).length > 0 ? session.collectedRequirements : null,
    };
  }

  getConversationHistory(sessionId: string) {
    const session = this.getSession(sessionId);
    return session.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content, richElements: m.richElements }));
  }

  getSession(sessionId: string): SessionRecord {
    const session = this.sessions.get(sessionId);
    if (!session) { throw new NotFoundException('Session ' + sessionId + ' not found'); }
    return session;
  }

  private parseResponse(content: string): { richElements?: RichElement[]; needsEscalation: boolean } {
    const richElements: RichElement[] = [];
    let needsEscalation = false;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      richElements.push({ type: 'code_block', data: { language: match[1] ?? 'text', code: match[2] } });
    }
    const escalationPhrases = ['transfer to human', 'connect you with a human', 'escalate', 'human agent', 'cannot help with this'];
    if (escalationPhrases.some((p) => content.toLowerCase().includes(p))) { needsEscalation = true; }
    return { richElements: richElements.length > 0 ? richElements : undefined, needsEscalation };
  }

  private getSuggestedActions(session: SessionRecord) {
    if (session.scenario === 'installation') {
      if (session.generatedPlan) {
        return [{ label: 'Confirm Order', action: 'confirm_order' }, { label: 'Modify Requirements', action: 'continue_chat' }];
      }
      if (hasMinimumRequirements(session.collectedRequirements)) {
        return [{ label: 'Generate Service Plan', action: 'generate_plan' }, { label: 'Provide More Details', action: 'continue_chat' }];
      }
    }
    return [{ label: 'Talk to Human Agent', action: 'escalate' }];
  }

  private buildPlanCard(tier: 'standard' | 'professional' | 'enterprise'): ServicePlanCard {
    const plans: Record<string, ServicePlanCard> = {
      standard: { tier: 'standard', price: 99, currency: 'USD', ocsasLevel: 1, estimatedDuration: 60, serviceContent: ['OpenClaw core installation', 'Basic security (OCSAS L1)', 'Common tool integrations', 'Token_Hub integration'], warrantyDays: 30, includesTokenHub: true },
      professional: { tier: 'professional', price: 299, currency: 'USD', ocsasLevel: 2, estimatedDuration: 120, serviceContent: ['OpenClaw core installation', 'Advanced security (OCSAS L2)', 'Personalized skill configuration', 'Token_Hub integration', 'Security audit report'], warrantyDays: 90, includesTokenHub: true },
      enterprise: { tier: 'enterprise', price: 999, currency: 'USD', ocsasLevel: 3, estimatedDuration: 240, serviceContent: ['OpenClaw core installation', 'Enterprise security (OCSAS L3)', 'Multi-user collaboration', 'Private model integration', 'Token_Hub integration', 'SLA guarantee'], warrantyDays: 180, includesTokenHub: true },
    };
    return plans[tier];
  }

  private findAvailableAgent(): string {
    return 'agent-' + Math.random().toString(36).substring(2, 10);
  }

  private generateId(): string {
    return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
  }
}
