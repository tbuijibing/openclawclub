import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';
import { DeliveryReport } from './delivery-report.entity';

@Entity('install_orders')
export class InstallOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'service_tier', type: 'varchar', length: 20 })
  serviceTier!: string;

  @Column({ name: 'ocsas_level', type: 'integer', default: 1 })
  ocsasLevel!: number;

  @Index('idx_install_orders_engineer_id')
  @Column({ name: 'engineer_id', type: 'uuid', nullable: true })
  engineerId?: string;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId?: string;

  @Column({ name: 'device_environment', type: 'jsonb', nullable: true })
  deviceEnvironment?: Record<string, unknown>;

  @Index('idx_install_orders_status')
  @Column({ name: 'install_status', type: 'varchar', length: 30, default: 'pending_dispatch' })
  installStatus!: string;

  @Column({ name: 'token_hub_connected', type: 'boolean', default: true })
  tokenHubConnected!: boolean;

  @Column({ name: 'warranty_end_date', type: 'date', nullable: true })
  warrantyEndDate?: Date;

  @Column({ name: 'warranty_repair_count', type: 'integer', default: 0 })
  warrantyRepairCount!: number;

  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt?: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'accepted_by_user_at', type: 'timestamptz', nullable: true })
  acceptedByUserAt?: Date;

  @OneToOne(() => Order, (order) => order.installOrder)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'engineer_id' })
  engineer?: User;

  @OneToOne(() => DeliveryReport, (dr) => dr.installOrder)
  deliveryReport?: DeliveryReport;
}
