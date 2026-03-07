import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TokenAccount } from './token-account.entity';

@Entity('token_usage_records')
@Index('idx_token_usage_account_created', ['accountId', 'createdAt'])
export class TokenUsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'varchar', length: 30 })
  provider!: string;

  @Column({ type: 'varchar', length: 50 })
  model!: string;

  @Column({ name: 'prompt_tokens', type: 'integer' })
  promptTokens!: number;

  @Column({ name: 'completion_tokens', type: 'integer' })
  completionTokens!: number;

  @Column({ name: 'total_tokens', type: 'integer' })
  totalTokens!: number;

  @Column({ name: 'cost_usd', type: 'decimal', precision: 10, scale: 6 })
  costUsd!: number;

  @Column({ name: 'price_usd', type: 'decimal', precision: 10, scale: 6 })
  priceUsd!: number;

  @Column({ name: 'request_id', type: 'varchar', length: 64, nullable: true })
  requestId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => TokenAccount, (ta) => ta.usageRecords)
  @JoinColumn({ name: 'account_id' })
  account!: TokenAccount;
}
