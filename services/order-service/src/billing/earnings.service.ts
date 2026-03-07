import { Injectable } from '@nestjs/common';
import { ENGINEER_SHARE_PERCENT } from '@openclaw-club/shared';

export interface EarningRecord {
  id: string;
  engineerId: string;
  orderId: string;
  grossAmount: number;
  netAmount: number;
  sharePercentage: number;
  status: 'pending' | 'settled' | 'escrow';
  currency: string;
  settledAt?: Date;
  createdAt: Date;
}

export interface EarningsReport {
  engineerId: string;
  pendingAmount: number;
  settledAmount: number;
  escrowAmount: number;
  currency: string;
  history: EarningRecord[];
}

@Injectable()
export class EarningsService {
  private earnings = new Map<string, EarningRecord>();

  /**
   * Record an earning for an engineer (called after settlement).
   */
  recordEarning(
    engineerId: string,
    orderId: string,
    grossAmount: number,
    currency: string,
    status: 'pending' | 'settled' | 'escrow' = 'settled',
  ): EarningRecord {
    const netAmount = Math.round(grossAmount * ENGINEER_SHARE_PERCENT) / 100;
    const record: EarningRecord = {
      id: crypto.randomUUID(),
      engineerId,
      orderId,
      grossAmount,
      netAmount,
      sharePercentage: ENGINEER_SHARE_PERCENT,
      status,
      currency,
      settledAt: status === 'settled' ? new Date() : undefined,
      createdAt: new Date(),
    };
    this.earnings.set(record.id, record);
    return record;
  }

  /**
   * Get earnings report for an engineer: pending, settled, escrow amounts + history.
   */
  getEngineerEarnings(engineerId: string): EarningsReport {
    const records = Array.from(this.earnings.values()).filter(
      (e) => e.engineerId === engineerId,
    );

    const pendingAmount = records
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + r.netAmount, 0);

    const settledAmount = records
      .filter((r) => r.status === 'settled')
      .reduce((sum, r) => sum + r.netAmount, 0);

    const escrowAmount = records
      .filter((r) => r.status === 'escrow')
      .reduce((sum, r) => sum + r.netAmount, 0);

    const currency = records[0]?.currency ?? 'USD';

    return {
      engineerId,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      settledAmount: Math.round(settledAmount * 100) / 100,
      escrowAmount: Math.round(escrowAmount * 100) / 100,
      currency,
      history: records,
    };
  }
}
