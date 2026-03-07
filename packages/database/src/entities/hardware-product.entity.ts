import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('hardware_products')
export class HardwareProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30 })
  category!: string;

  @Column({ type: 'jsonb' })
  name!: Record<string, string>;

  @Column({ type: 'jsonb' })
  description!: Record<string, string>;

  @Column({ type: 'jsonb' })
  specs!: Record<string, unknown>;

  @Column({ name: 'preinstalled_software', type: 'jsonb', nullable: true })
  preinstalledSoftware?: Record<string, unknown>;

  @Column({ name: 'token_hub_bonus_amount', type: 'decimal', precision: 8, scale: 2, nullable: true })
  tokenHubBonusAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'stock_by_region', type: 'jsonb', nullable: true })
  stockByRegion?: Record<string, number>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
