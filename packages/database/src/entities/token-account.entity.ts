import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TokenUsageRecord } from './token-usage-record.entity';

@Entity('token_accounts')
export class TokenAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'balance_usd', type: 'decimal', precision: 12, scale: 4, default: 0 })
  balanceUsd!: number;

  @Column({ name: 'billing_mode', type: 'varchar', length: 20, default: 'pay_as_you_go' })
  billingMode!: string;

  @Column({ name: 'monthly_quota_usd', type: 'decimal', precision: 12, scale: 2, nullable: true })
  monthlyQuotaUsd?: number;

  @Column({ name: 'budget_alert_threshold', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetAlertThreshold?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.tokenAccounts)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => TokenUsageRecord, (tur) => tur.account)
  usageRecords?: TokenUsageRecord[];
}
