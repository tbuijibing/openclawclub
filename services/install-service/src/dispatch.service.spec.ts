import { DispatchService, EngineerProfile } from './dispatch.service';
import { InstallService } from './install.service';

describe('DispatchService', () => {
  let installService: InstallService;
  let dispatchService: DispatchService;

  const makeEngineer = (overrides: Partial<EngineerProfile> = {}): EngineerProfile => ({
    id: crypto.randomUUID(),
    skillLevel: 4,
    currentLoad: 2,
    timezone: 'Asia/Shanghai',
    avgRating: 4.5,
    avgResponseMinutes: 15,
    region: 'apac',
    available: true,
    ...overrides,
  });

  beforeEach(() => {
    installService = new InstallService();
    dispatchService = new DispatchService(installService);
  });

  describe('matchEngineer', () => {
    it('should return empty array when no engineers available', () => {
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      const matches = dispatchService.matchEngineer(order.id);
      expect(matches).toHaveLength(0);
    });

    it('should rank engineers by composite score', () => {
      const eng1 = makeEngineer({ id: 'eng-1', skillLevel: 5, avgRating: 5, currentLoad: 1 });
      const eng2 = makeEngineer({ id: 'eng-2', skillLevel: 3, avgRating: 3, currentLoad: 5 });
      dispatchService.registerEngineer(eng1);
      dispatchService.registerEngineer(eng2);

      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      const matches = dispatchService.matchEngineer(order.id);

      expect(matches[0].engineerId).toBe('eng-1');
      expect(matches[0].score).toBeGreaterThan(matches[1].score);
    });

    it('should boost score for timezone match', () => {
      const eng1 = makeEngineer({ id: 'eng-1', timezone: 'America/New_York', skillLevel: 3, avgRating: 3 });
      const eng2 = makeEngineer({ id: 'eng-2', timezone: 'Asia/Shanghai', skillLevel: 3, avgRating: 3 });
      dispatchService.registerEngineer(eng1);
      dispatchService.registerEngineer(eng2);

      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      const matches = dispatchService.matchEngineer(order.id, 'Asia/Shanghai');

      const shanghaiMatch = matches.find((m) => m.engineerId === 'eng-2')!;
      const nyMatch = matches.find((m) => m.engineerId === 'eng-1')!;
      expect(shanghaiMatch.timezoneMatch).toBe(true);
      expect(nyMatch.timezoneMatch).toBe(false);
      expect(shanghaiMatch.score).toBeGreaterThan(nyMatch.score);
    });

    it('should exclude unavailable engineers', () => {
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-1', available: false }));
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-2', available: true }));

      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      const matches = dispatchService.matchEngineer(order.id);
      expect(matches).toHaveLength(1);
      expect(matches[0].engineerId).toBe('eng-2');
    });
  });

  describe('dispatchOrder', () => {
    it('should create a dispatch record', () => {
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-1' }));
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });

      const dispatch = dispatchService.dispatchOrder(order.id);
      expect(dispatch.status).toBe('dispatched');
      expect(dispatch.matches.length).toBeGreaterThan(0);
    });

    it('should reject dispatch for non-pending orders', () => {
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      installService.acceptOrder(order.id, 'eng-1');

      expect(() => dispatchService.dispatchOrder(order.id)).toThrow(
        /not in pending_dispatch/,
      );
    });
  });

  describe('escalateDispatch', () => {
    it('should escalate to expand level', () => {
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-1' }));
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      dispatchService.dispatchOrder(order.id);

      const result = dispatchService.escalateDispatch(order.id, 'expand');
      expect(result.status).toBe('escalated_expand');
    });

    it('should escalate to manual level', () => {
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-1' }));
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      dispatchService.dispatchOrder(order.id);

      const result = dispatchService.escalateDispatch(order.id, 'manual');
      expect(result.status).toBe('escalated_manual');
    });
  });

  describe('routeToExternalPlatform', () => {
    it('should route to external platform', () => {
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-1' }));
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      dispatchService.dispatchOrder(order.id);

      const result = dispatchService.routeToExternalPlatform(order.id, 'fiverr');
      expect(result.status).toBe('routed_external');
      expect(result.externalPlatform).toBe('fiverr');
    });
  });

  describe('processDispatchTimeouts', () => {
    it('should escalate orders past 30 min to expand', () => {
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-1' }));
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      dispatchService.dispatchOrder(order.id);

      // Backdate dispatch to 35 minutes ago
      const dispatch = dispatchService.getDispatch(order.id)!;
      dispatch.dispatchedAt = new Date(Date.now() - 35 * 60 * 1000);

      const result = dispatchService.processDispatchTimeouts();
      expect(result.expanded).toContain(order.id);
    });

    it('should escalate orders past 60 min to manual', () => {
      dispatchService.registerEngineer(makeEngineer({ id: 'eng-1' }));
      const order = installService.createInstallOrder({ userId: 'u1', tier: 'standard' });
      dispatchService.dispatchOrder(order.id);

      // Backdate dispatch to 65 minutes ago
      const dispatch = dispatchService.getDispatch(order.id)!;
      dispatch.dispatchedAt = new Date(Date.now() - 65 * 60 * 1000);

      const result = dispatchService.processDispatchTimeouts();
      expect(result.manualIntervention).toContain(order.id);
    });
  });
});
