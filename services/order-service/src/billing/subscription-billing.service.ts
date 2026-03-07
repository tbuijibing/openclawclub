import { Injectable } from '@nestjs/common';

export interface SubscriptionChargeRecord {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  currency: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  chargedAt: Date;
  notificationSent: boolean;
}

@Injectable()
export class SubscriptionBillingService {
  private charges = new Map<string, SubscriptionChargeRecord>();

  /**
   * Process auto-deduction for a subscription billing cycle.
   * Returns the charge record and marks notification as sent.
   */
  processAutoCharge(
    subscriptionId: string,
    userId: string,
    amount: number,
    currency: string,
    periodStart: Date,
    periodEnd: Date,
  ): SubscriptionChargeRecord {
    const charge: SubscriptionChargeRecord = {
      id: crypto.randomUUID(),
      subscriptionId,
      userId,
      amount,
      currency,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      chargedAt: new Date(),
      notificationSent: true,
    };

    this.charges.set(charge.id, charge);
    return charge;
  }

  getChargesBySubscription(subscriptionId: string): SubscriptionChargeRecord[] {
    return Array.from(this.charges.values()).filter(
      (c) => c.subscriptionId === subscriptionId,
    );
  }
}
