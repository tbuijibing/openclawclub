import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ExternalPlatform,
  DISPATCH_EXPAND_TIMEOUT_MINUTES,
  DISPATCH_MANUAL_TIMEOUT_MINUTES,
} from '@openclaw-club/shared';
import { InstallService, InstallOrderRecord } from './install.service';

export interface EngineerProfile {
  id: string;
  skillLevel: number;       // 1-5
  currentLoad: number;      // current active orders
  timezone: string;
  avgRating: number;         // 1-5
  avgResponseMinutes: number;
  region: string;
  available: boolean;
}

export interface EngineerMatch {
  engineerId: string;
  score: number;
  skillLevel: number;
  currentLoad: number;
  timezoneMatch: boolean;
  avgRating: number;
  responseTime: number;
}

export type DispatchLevel = 'expand' | 'manual' | 'external';

export interface DispatchRecord {
  orderId: string;
  installOrderId: string;
  matches: EngineerMatch[];
  dispatchedAt: Date;
  level: DispatchLevel | 'normal';
  externalPlatform?: ExternalPlatform;
  status: 'dispatched' | 'escalated_expand' | 'escalated_manual' | 'routed_external';
}

@Injectable()
export class DispatchService {
  /** In-memory engineer registry — will be replaced by DB */
  private engineers = new Map<string, EngineerProfile>();
  private dispatches = new Map<string, DispatchRecord>();

  constructor(private readonly installService: InstallService) {}

  /**
   * Register an engineer profile (for testing / admin use).
   */
  registerEngineer(profile: EngineerProfile): void {
    this.engineers.set(profile.id, profile);
  }

  /**
   * Match engineers for an install order based on multiple factors.
   * Scoring: skillLevel (30%) + availability/load (25%) + timezone match (20%) + rating (15%) + response speed (10%)
   */
  matchEngineer(installOrderId: string, userTimezone?: string): EngineerMatch[] {
    const order = this.installService.getInstallOrder(installOrderId);
    const available = Array.from(this.engineers.values()).filter((e) => e.available);

    if (available.length === 0) return [];

    const matches: EngineerMatch[] = available.map((eng) => {
      const timezoneMatch = userTimezone ? eng.timezone === userTimezone : false;

      // Normalize scores to 0-1 range
      const skillScore = eng.skillLevel / 5;
      const loadScore = 1 - Math.min(eng.currentLoad / 10, 1); // lower load = higher score
      const tzScore = timezoneMatch ? 1 : 0;
      const ratingScore = eng.avgRating / 5;
      const responseScore = 1 - Math.min(eng.avgResponseMinutes / 120, 1); // faster = higher

      const score =
        skillScore * 0.3 +
        loadScore * 0.25 +
        tzScore * 0.2 +
        ratingScore * 0.15 +
        responseScore * 0.1;

      return {
        engineerId: eng.id,
        score: Math.round(score * 100) / 100,
        skillLevel: eng.skillLevel,
        currentLoad: eng.currentLoad,
        timezoneMatch,
        avgRating: eng.avgRating,
        responseTime: eng.avgResponseMinutes,
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);
    return matches;
  }

  /**
   * Dispatch an order: match engineers and record the dispatch.
   */
  dispatchOrder(installOrderId: string, userTimezone?: string): DispatchRecord {
    const order = this.installService.getInstallOrder(installOrderId);
    if (order.installStatus !== 'pending_dispatch') {
      throw new BadRequestException('Order is not in pending_dispatch status');
    }

    const matches = this.matchEngineer(installOrderId, userTimezone);

    const record: DispatchRecord = {
      orderId: order.orderId,
      installOrderId,
      matches,
      dispatchedAt: new Date(),
      level: 'normal',
      status: 'dispatched',
    };

    order.dispatchedAt = new Date();
    order.updatedAt = new Date();
    this.dispatches.set(installOrderId, record);
    return record;
  }

  /**
   * Escalate dispatch when no engineer accepts within timeout.
   * - 30 min: expand matching range
   * - 60 min: notify operations for manual intervention
   */
  escalateDispatch(installOrderId: string, level: DispatchLevel): DispatchRecord {
    const dispatch = this.dispatches.get(installOrderId);
    if (!dispatch) {
      throw new NotFoundException(`No dispatch record for install order ${installOrderId}`);
    }

    if (level === 'expand') {
      // Re-match with all engineers (including those with higher load)
      const allEngineers = Array.from(this.engineers.values());
      const expandedMatches: EngineerMatch[] = allEngineers.map((eng) => ({
        engineerId: eng.id,
        score: eng.avgRating / 5,
        skillLevel: eng.skillLevel,
        currentLoad: eng.currentLoad,
        timezoneMatch: false,
        avgRating: eng.avgRating,
        responseTime: eng.avgResponseMinutes,
      }));
      expandedMatches.sort((a, b) => b.score - a.score);

      dispatch.matches = expandedMatches;
      dispatch.level = 'expand';
      dispatch.status = 'escalated_expand';
    } else if (level === 'manual') {
      dispatch.level = 'manual';
      dispatch.status = 'escalated_manual';
      // In production: send notification to operations team
    } else if (level === 'external') {
      dispatch.level = 'external';
      dispatch.status = 'routed_external';
    }

    return dispatch;
  }

  /**
   * Route order to an external service platform (Fiverr, Upwork, etc.).
   */
  routeToExternalPlatform(installOrderId: string, platform: ExternalPlatform): DispatchRecord {
    const dispatch = this.dispatches.get(installOrderId);
    if (!dispatch) {
      throw new NotFoundException(`No dispatch record for install order ${installOrderId}`);
    }

    dispatch.externalPlatform = platform;
    dispatch.status = 'routed_external';
    dispatch.level = 'external';
    return dispatch;
  }

  /**
   * Check for dispatch timeouts and escalate accordingly.
   */
  processDispatchTimeouts(): { expanded: string[]; manualIntervention: string[] } {
    const now = Date.now();
    const expanded: string[] = [];
    const manualIntervention: string[] = [];

    for (const [installOrderId, dispatch] of this.dispatches) {
      const order = this.installService.getInstallOrder(installOrderId);
      if (order.installStatus !== 'pending_dispatch') continue;

      const elapsedMinutes = (now - dispatch.dispatchedAt.getTime()) / (1000 * 60);

      if (elapsedMinutes >= DISPATCH_MANUAL_TIMEOUT_MINUTES && dispatch.level !== 'manual' && dispatch.level !== 'external') {
        this.escalateDispatch(installOrderId, 'manual');
        manualIntervention.push(installOrderId);
      } else if (elapsedMinutes >= DISPATCH_EXPAND_TIMEOUT_MINUTES && dispatch.level === 'normal') {
        this.escalateDispatch(installOrderId, 'expand');
        expanded.push(installOrderId);
      }
    }

    return { expanded, manualIntervention };
  }

  /**
   * Get dispatch record for an install order.
   */
  getDispatch(installOrderId: string): DispatchRecord | undefined {
    return this.dispatches.get(installOrderId);
  }
}
