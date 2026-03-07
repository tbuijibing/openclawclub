import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InstallOrder } from './install-order.entity';

@Entity('delivery_reports')
export class DeliveryReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'install_order_id', type: 'uuid' })
  installOrderId!: string;

  @Column({ type: 'jsonb' })
  checklist!: Record<string, unknown>;

  @Column({ name: 'config_items', type: 'jsonb' })
  configItems!: Record<string, unknown>;

  @Column({ name: 'test_results', type: 'jsonb' })
  testResults!: Record<string, unknown>;

  @Column({ type: 'text', array: true, nullable: true })
  screenshots?: string[];

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @OneToOne(() => InstallOrder, (io) => io.deliveryReport)
  @JoinColumn({ name: 'install_order_id' })
  installOrder!: InstallOrder;
}
