import {
  extractRequirements,
  getMissingFields,
  hasAllRequirements,
  hasMinimumRequirements,
  recommendTier,
  REQUIRED_FIELDS,
} from './requirements-collector';
import { ServiceRequirements } from './types';

describe('RequirementsCollector', () => {
  describe('extractRequirements', () => {
    it('should extract operating system from Ubuntu mention', () => {
      const result = extractRequirements('I am running Ubuntu 22.04', {});
      expect(result.operatingSystem).toBeDefined();
    });

    it('should extract operating system from macOS mention', () => {
      const result = extractRequirements('My machine runs macOS Sonoma', {});
      expect(result.operatingSystem).toBeDefined();
    });

    it('should extract operating system from Windows mention', () => {
      const result = extractRequirements('I use Windows 11 Pro', {});
      expect(result.operatingSystem).toBeDefined();
    });

    it('should extract device environment from RAM mention', () => {
      const result = extractRequirements('I have 32GB RAM', {});
      expect(result.deviceEnvironment).toBeDefined();
    });

    it('should extract device environment from GPU mention', () => {
      const result = extractRequirements(
        'My server has an NVIDIA RTX 4090',
        {},
      );
      expect(result.deviceEnvironment).toBeDefined();
    });

    it('should extract device environment from Mac Mini mention', () => {
      const result = extractRequirements('I have a Mac Mini M2', {});
      expect(result.deviceEnvironment).toBeDefined();
    });

    it('should extract network environment from VPN mention', () => {
      const result = extractRequirements(
        'We connect through a corporate VPN',
        {},
      );
      expect(result.networkEnvironment).toBeDefined();
    });

    it('should extract network environment from air-gapped mention', () => {
      const result = extractRequirements(
        'The network is air-gapped for security',
        {},
      );
      expect(result.networkEnvironment).toBeDefined();
    });

    it('should extract use case from enterprise mention', () => {
      const result = extractRequirements(
        'This is for our enterprise deployment',
        {},
      );
      expect(result.useCase).toBeDefined();
    });

    it('should extract use case from team mention', () => {
      const result = extractRequirements(
        'Our team of 10 developers needs this',
        {},
      );
      expect(result.useCase).toBeDefined();
    });

    it('should extract preferred service time from morning mention', () => {
      const result = extractRequirements(
        'I prefer morning time for the installation',
        {},
      );
      expect(result.preferredServiceTime).toBeDefined();
    });

    it('should extract preferred service time from ASAP mention', () => {
      const result = extractRequirements(
        'We need this done ASAP',
        {},
      );
      expect(result.preferredServiceTime).toBeDefined();
    });

    it('should not overwrite already collected fields', () => {
      const existing: Partial<ServiceRequirements> = {
        operatingSystem: 'Ubuntu 22.04',
      };
      const result = extractRequirements('I also have Windows 11', existing);
      expect(result.operatingSystem).toBeUndefined();
    });

    it('should extract multiple fields from a single message', () => {
      const result = extractRequirements(
        'I have a server with 64GB RAM running Ubuntu for enterprise production',
        {},
      );
      expect(result.deviceEnvironment).toBeDefined();
      expect(result.operatingSystem).toBeDefined();
      expect(result.useCase).toBeDefined();
    });

    it('should return empty object for irrelevant message', () => {
      const result = extractRequirements('Hello, how are you?', {});
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('getMissingFields', () => {
    it('should return all fields when nothing collected', () => {
      const missing = getMissingFields({});
      expect(missing).toEqual(REQUIRED_FIELDS);
    });

    it('should return remaining fields', () => {
      const missing = getMissingFields({
        operatingSystem: 'Ubuntu',
        deviceEnvironment: '16GB RAM',
      });
      expect(missing).toContain('networkEnvironment');
      expect(missing).toContain('useCase');
      expect(missing).toContain('preferredServiceTime');
      expect(missing).not.toContain('operatingSystem');
      expect(missing).not.toContain('deviceEnvironment');
    });

    it('should return empty array when all collected', () => {
      const missing = getMissingFields({
        operatingSystem: 'Ubuntu',
        deviceEnvironment: '16GB RAM',
        networkEnvironment: 'direct',
        useCase: 'personal',
        preferredServiceTime: 'morning',
      });
      expect(missing).toHaveLength(0);
    });
  });

  describe('hasAllRequirements', () => {
    it('should return false when fields are missing', () => {
      expect(hasAllRequirements({})).toBe(false);
      expect(
        hasAllRequirements({ operatingSystem: 'Ubuntu' }),
      ).toBe(false);
    });

    it('should return true when all fields are present', () => {
      expect(
        hasAllRequirements({
          operatingSystem: 'Ubuntu',
          deviceEnvironment: '16GB RAM',
          networkEnvironment: 'direct',
          useCase: 'personal',
          preferredServiceTime: 'morning',
        }),
      ).toBe(true);
    });
  });

  describe('hasMinimumRequirements', () => {
    it('should return false with no requirements', () => {
      expect(hasMinimumRequirements({})).toBe(false);
    });

    it('should return false with only OS', () => {
      expect(
        hasMinimumRequirements({ operatingSystem: 'Ubuntu' }),
      ).toBe(false);
    });

    it('should return true with OS, device, and use case', () => {
      expect(
        hasMinimumRequirements({
          operatingSystem: 'Ubuntu',
          deviceEnvironment: '16GB RAM',
          useCase: 'personal',
        }),
      ).toBe(true);
    });
  });

  describe('recommendTier', () => {
    it('should recommend standard for personal use', () => {
      expect(recommendTier({ useCase: 'personal development' })).toBe(
        'standard',
      );
    });

    it('should recommend professional for team use', () => {
      expect(recommendTier({ useCase: 'team collaboration' })).toBe(
        'professional',
      );
    });

    it('should recommend enterprise for enterprise use', () => {
      expect(recommendTier({ useCase: 'enterprise deployment' })).toBe(
        'enterprise',
      );
    });

    it('should recommend enterprise for production use', () => {
      expect(recommendTier({ useCase: 'production environment' })).toBe(
        'enterprise',
      );
    });

    it('should recommend enterprise for air-gapped network', () => {
      expect(
        recommendTier({
          useCase: 'development',
          networkEnvironment: 'air-gapped network',
        }),
      ).toBe('enterprise');
    });

    it('should recommend enterprise for server hardware', () => {
      expect(
        recommendTier({
          useCase: 'development',
          deviceEnvironment: 'dedicated server cluster',
        }),
      ).toBe('enterprise');
    });

    it('should default to standard for unknown use case', () => {
      expect(recommendTier({ useCase: 'something else' })).toBe('standard');
    });

    it('should default to standard with empty requirements', () => {
      expect(recommendTier({})).toBe('standard');
    });
  });
});
