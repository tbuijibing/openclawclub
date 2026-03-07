import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('configuration_packs')
export class ConfigurationPack {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  category!: string;

  @Column({ name: 'monthly_price', type: 'decimal', precision: 8, scale: 2 })
  monthlyPrice!: number;

  @Column({ type: 'jsonb' })
  description!: Record<string, string>;

  @Column({ type: 'varchar', length: 20 })
  version!: string;

  @Column({ name: 'contributor_id', type: 'uuid', nullable: true })
  contributorId?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'contributor_id' })
  contributor?: User;
}
