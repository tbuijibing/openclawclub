import { ConciergeService, SessionRecord } from './concierge.service';
import { TokenHubClient } from './token-hub.client';

describe('ConciergeService', () => {
  let service: ConciergeService;
  let mockTokenHubClient: jest.Mocked<TokenHubClient>;

  const mockCompletion = (content: string) => ({
    id: 'test-id',
    object: 'chat.completion' as const,
    created: Date.now(),
    model: 'gpt-4o',
    choices: [
      {
        index: 0,
        message: { role: 'assistant' as const, content },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  });

  beforeEach(() => {
    mockTokenHubClient = {
      chatCompletion: jest
        .fn()
        .mockResolvedValue(mockCompletion('Hello! How can I help you?')),
    } as any;
    service = new ConciergeService(mockTokenHubClient);
  });

  describe('createSession', () => {
    it('should create a session with default language and scenario', () => {
      const session = service.createSession('user-1');
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user-1');
      expect(session.language).toBe('en');
      expect(session.scenario).toBe('general');
      expect(session.status).toBe('active');
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].role).toBe('system');
    });

    it('should create a session with specified language and scenario', () => {
      const session = service.createSession('user-1', 'zh', 'installation');
      expect(session.language).toBe('zh');
      expect(session.scenario).toBe('installation');
      expect(session.messages[0].content).toContain('Chinese');
    });

    it('should fall back to English for unsupported language', () => {
      const session = service.createSession('user-1', 'xx');
      expect(session.language).toBe('en');
    });

    it('should support all 7 languages', () => {
      const langs = ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'];
      for (const lang of langs) {
        const session = service.createSession('user-1', lang);
        expect(session.language).toBe(lang);
      }
    });
  });

  describe('sendMessage', () => {
    it('should send message and return AI response', async () => {
      const session = service.createSession('user-1', 'en', 'general');
      const response = await service.sendMessage(session.id, 'Hello');

      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.needsEscalation).toBe(false);
      expect(mockTokenHubClient.chatCompletion).toHaveBeenCalledTimes(1);
    });

    it('should maintain multi-turn context', async () => {
      const session = service.createSession('user-1', 'en', 'general');
      await service.sendMessage(session.id, 'First message');
      await service.sendMessage(session.id, 'Second message');

      const lastCall = mockTokenHubClient.chatCompletion.mock.calls[1][0];
      // system(1) + user(1) + assistant(1) + user(2) = 4
      expect(lastCall.messages.length).toBeGreaterThanOrEqual(4);
    });

    it('should auto-detect Chinese and switch language', async () => {
      const session = service.createSession('user-1', 'en', 'general');
      await service.sendMessage(session.id, '\u4f60\u597d\uff0c\u6211\u60f3\u5b89\u88c5 OpenClaw');

      const updated = service.getSession(session.id);
      expect(updated.language).toBe('zh');
    });

    it('should auto-detect Japanese and switch language', async () => {
      const session = service.createSession('user-1', 'en', 'general');
      await service.sendMessage(
        session.id,
        '\u3053\u3093\u306b\u3061\u306f\u3001OpenClaw\u3092\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u3057\u305f\u3044',
      );

      const updated = service.getSession(session.id);
      expect(updated.language).toBe('ja');
    });

    it('should throw for non-active session', async () => {
      const session = service.createSession('user-1');
      service.escalateToHuman(session.id, 'test');

      await expect(
        service.sendMessage(session.id, 'hello'),
      ).rejects.toThrow('escalated');
    });

    it('should detect escalation phrases in response', async () => {
      mockTokenHubClient.chatCompletion.mockResolvedValueOnce(
        mockCompletion(
          'I cannot help with this, let me transfer to human agent.',
        ),
      );
      const session = service.createSession('user-1');
      const response = await service.sendMessage(session.id, 'complex issue');

      expect(response.needsEscalation).toBe(true);
    });

    it('should detect code blocks as rich elements', async () => {
      mockTokenHubClient.chatCompletion.mockResolvedValueOnce(
        mockCompletion('Here is the config:\n```yaml\nkey: value\n```'),
      );
      const session = service.createSession('user-1');
      const response = await service.sendMessage(session.id, 'show config');

      expect(response.richElements).toBeDefined();
      expect(response.richElements![0].type).toBe('code_block');
      expect(response.richElements![0].data).toEqual({
        language: 'yaml',
        code: 'key: value\n',
      });
    });

    it('should collect OS info from installation conversation', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(session.id, 'I am running Ubuntu 22.04');

      const updated = service.getSession(session.id);
      expect(updated.collectedRequirements.operatingSystem).toBeDefined();
    });

    it('should collect device environment info', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(
        session.id,
        'I have a Mac Mini with 16GB RAM and Apple M2 chip',
      );

      const updated = service.getSession(session.id);
      expect(updated.collectedRequirements.deviceEnvironment).toBeDefined();
    });

    it('should collect network environment info', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(
        session.id,
        'We use a corporate VPN for all connections',
      );

      const updated = service.getSession(session.id);
      expect(updated.collectedRequirements.networkEnvironment).toBeDefined();
    });

    it('should collect use case info', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(
        session.id,
        'This is for our enterprise production environment',
      );

      const updated = service.getSession(session.id);
      expect(updated.collectedRequirements.useCase).toBeDefined();
    });

    it('should collect preferred service time', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(
        session.id,
        'I prefer morning time, around 9:00 AM EST',
      );

      const updated = service.getSession(session.id);
      expect(
        updated.collectedRequirements.preferredServiceTime,
      ).toBeDefined();
    });

    it('should not overwrite already collected fields', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(session.id, 'I am running Ubuntu 22.04');
      const firstOS = service.getSession(session.id).collectedRequirements
        .operatingSystem;

      await service.sendMessage(session.id, 'Actually I also have Windows 11');
      const secondOS = service.getSession(session.id).collectedRequirements
        .operatingSystem;

      expect(secondOS).toBe(firstOS);
    });

    it('should suggest generate_plan when minimum requirements met', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(session.id, 'Running Ubuntu with 16GB RAM');
      await service.sendMessage(
        session.id,
        'This is for personal development use',
      );

      const updated = service.getSession(session.id);
      expect(updated.collectedRequirements.operatingSystem).toBeDefined();
      expect(updated.collectedRequirements.deviceEnvironment).toBeDefined();
      expect(updated.collectedRequirements.useCase).toBeDefined();
    });
  });

  describe('generateServicePlan', () => {
    function createSessionWithRequirements(
      overrides: Record<string, string> = {},
    ) {
      const session = service.createSession('user-1', 'en', 'installation');
      const defaults = {
        operatingSystem: 'Ubuntu 22.04',
        deviceEnvironment: 'Mac Mini with 16GB RAM',
        useCase: 'personal development',
        networkEnvironment: 'direct internet',
        preferredServiceTime: 'morning EST',
      };
      const reqs = { ...defaults, ...overrides };
      Object.assign(session.collectedRequirements, reqs);
      return session;
    }

    it('should generate standard plan for personal use', () => {
      const session = createSessionWithRequirements({
        useCase: 'personal development',
      });

      const plan = service.generateServicePlan(session.id);
      expect(plan.tier).toBe('standard');
      expect(plan.price).toBe(99);
      expect(plan.ocsasLevel).toBe(1);
      expect(plan.warrantyDays).toBe(30);
      expect(plan.includesTokenHub).toBe(true);
    });

    it('should generate professional plan for team use', () => {
      const session = createSessionWithRequirements({
        useCase: 'team collaboration',
      });

      const plan = service.generateServicePlan(session.id);
      expect(plan.tier).toBe('professional');
      expect(plan.price).toBe(299);
      expect(plan.ocsasLevel).toBe(2);
      expect(plan.warrantyDays).toBe(90);
    });

    it('should generate enterprise plan for enterprise use', () => {
      const session = createSessionWithRequirements({
        useCase: 'enterprise deployment',
      });

      const plan = service.generateServicePlan(session.id);
      expect(plan.tier).toBe('enterprise');
      expect(plan.price).toBe(999);
      expect(plan.ocsasLevel).toBe(3);
      expect(plan.warrantyDays).toBe(180);
    });

    it('should generate enterprise plan for production use', () => {
      const session = createSessionWithRequirements({
        useCase: 'production environment',
      });

      const plan = service.generateServicePlan(session.id);
      expect(plan.tier).toBe('enterprise');
    });

    it('should generate enterprise plan for air-gapped network', () => {
      const session = createSessionWithRequirements({
        useCase: 'development',
        networkEnvironment: 'air-gapped secure network',
      });

      const plan = service.generateServicePlan(session.id);
      expect(plan.tier).toBe('enterprise');
    });

    it('should add service plan card to conversation', () => {
      const session = createSessionWithRequirements();
      service.generateServicePlan(session.id);

      const history = service.getConversationHistory(session.id);
      const lastMsg = history[history.length - 1];
      expect(lastMsg.richElements).toBeDefined();
      expect(lastMsg.richElements![0].type).toBe('service_plan_card');
    });

    it('should store generated plan on session', () => {
      const session = createSessionWithRequirements();
      const plan = service.generateServicePlan(session.id);

      const updated = service.getSession(session.id);
      expect(updated.generatedPlan).toEqual(plan);
    });

    it('should throw when minimum requirements not met', () => {
      const session = service.createSession('user-1', 'en', 'installation');
      // No requirements collected

      expect(() => service.generateServicePlan(session.id)).toThrow(
        'Not enough requirements',
      );
    });

    it('should throw when only OS is collected', () => {
      const session = service.createSession('user-1', 'en', 'installation');
      session.collectedRequirements = { operatingSystem: 'Ubuntu' };

      expect(() => service.generateServicePlan(session.id)).toThrow(
        'Not enough requirements',
      );
    });

    it('should throw for non-existent session', () => {
      expect(() => service.generateServicePlan('nonexistent')).toThrow(
        'not found',
      );
    });

    it('should suggest confirm_order after plan is generated', () => {
      const session = createSessionWithRequirements();
      service.generateServicePlan(session.id);

      const actions = (service as any).getSuggestedActions(
        service.getSession(session.id),
      );
      expect(actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'confirm_order' }),
        ]),
      );
    });
  });

  describe('confirmOrder', () => {
    function createSessionWithPlan(useCase = 'personal development') {
      const session = service.createSession('user-1', 'en', 'installation');
      Object.assign(session.collectedRequirements, {
        operatingSystem: 'Ubuntu 22.04',
        deviceEnvironment: 'Mac Mini with 16GB RAM',
        useCase,
        networkEnvironment: 'direct internet',
        preferredServiceTime: 'morning EST',
      });
      service.generateServicePlan(session.id);
      return session;
    }

    it('should create order from generated plan', () => {
      const session = createSessionWithPlan();
      const result = service.confirmOrder(session.id);

      expect(result.status).toBe('order_created');
      expect(result.sessionId).toBe(session.id);
      expect(result.userId).toBe('user-1');
      expect(result.orderId).toBeDefined();
      expect(result.installOrderId).toBeDefined();
      expect(result.serviceTier).toBe('standard');
      expect(result.price).toBe(99);
      expect(result.currency).toBe('USD');
      expect(result.collectedRequirements).toBeDefined();
    });

    it('should create enterprise order for enterprise use case', () => {
      const session = createSessionWithPlan('enterprise deployment');
      const result = service.confirmOrder(session.id);

      expect(result.serviceTier).toBe('enterprise');
      expect(result.price).toBe(999);
    });

    it('should add order confirmation to conversation history', () => {
      const session = createSessionWithPlan();
      const result = service.confirmOrder(session.id);

      const history = service.getConversationHistory(session.id);
      const lastMsg = history[history.length - 1];
      expect(lastMsg.content).toContain('Order confirmed');
      expect(lastMsg.content).toContain(result.orderId);
      expect(lastMsg.richElements).toBeDefined();
      expect(lastMsg.richElements![0].type).toBe('card');
    });

    it('should throw if no plan has been generated', () => {
      const session = service.createSession('user-1', 'en', 'installation');

      expect(() => service.confirmOrder(session.id)).toThrow(
        'No service plan has been generated',
      );
    });

    it('should throw for non-existent session', () => {
      expect(() => service.confirmOrder('nonexistent')).toThrow('not found');
    });

    it('should include collected requirements in order result', () => {
      const session = createSessionWithPlan();
      const result = service.confirmOrder(session.id);

      expect(result.collectedRequirements.operatingSystem).toBe(
        'Ubuntu 22.04',
      );
      expect(result.collectedRequirements.deviceEnvironment).toBe(
        'Mac Mini with 16GB RAM',
      );
    });
  });

  describe('escalateToHuman', () => {
    it('should escalate session and return context', () => {
      const session = service.createSession('user-1');
      const result = service.escalateToHuman(session.id, 'Need human help');

      expect(result.sessionId).toBe(session.id);
      expect(result.agentId).toBeDefined();
      expect(result.reason).toBe('Need human help');
      expect(result.language).toBe('en');
      expect(result.scenario).toBe('general');
      expect(result.conversationHistory).toEqual([]);

      const updated = service.getSession(session.id);
      expect(updated.status).toBe('escalated');
      expect(updated.escalatedToAgentId).toBe(result.agentId);
    });

    it('should include conversation history in escalation', async () => {
      const session = service.createSession('user-1');
      await service.sendMessage(session.id, 'I have a problem');

      const result = service.escalateToHuman(session.id, 'Complex issue');
      expect(result.conversationHistory.length).toBeGreaterThan(0);
      expect(result.conversationHistory[0].role).toBe('user');
    });

    it('should include collected requirements in escalation', async () => {
      const session = service.createSession('user-1', 'en', 'installation');
      await service.sendMessage(
        session.id,
        'I am running Ubuntu with 16GB RAM',
      );

      const result = service.escalateToHuman(session.id, 'Need help');
      expect(result).toHaveProperty('collectedRequirements');
    });

    it('should preserve language and scenario in escalation', () => {
      const session = service.createSession('user-1', 'zh', 'installation');
      const result = service.escalateToHuman(session.id, 'AI cannot answer');

      expect(result.language).toBe('zh');
      expect(result.scenario).toBe('installation');
    });

    it('should throw if already escalated', () => {
      const session = service.createSession('user-1');
      service.escalateToHuman(session.id, 'first');
      expect(() =>
        service.escalateToHuman(session.id, 'second'),
      ).toThrow('already escalated');
    });
  });

  describe('getConversationHistory', () => {
    it('should return empty history for new session', () => {
      const session = service.createSession('user-1');
      const history = service.getConversationHistory(session.id);
      expect(history).toEqual([]);
    });

    it('should return messages excluding system prompt', async () => {
      const session = service.createSession('user-1');
      await service.sendMessage(session.id, 'Hello');

      const history = service.getConversationHistory(session.id);
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
    });
  });
});
