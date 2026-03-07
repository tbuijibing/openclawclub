import type { SubscriptionCycle, PackCategory } from '@openclaw-club/shared';

export class SubscribeDto {
  userId!: string;
  packId!: string;
  cycle!: SubscriptionCycle;
}

export class DeployPackDto {
  subscriptionId!: string;
}

export class CancelSubscriptionDto {
  subscriptionId!: string;
}

export class PushUpdateDto {
  packId!: string;
  version!: string;
}

export class ProcessAutoRenewalDto {
  subscriptionId!: string;
}
