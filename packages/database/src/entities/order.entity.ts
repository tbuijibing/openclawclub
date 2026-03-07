import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Payment } from './payment.entity';
import { InstallOrder } from './install-order.entity';
import { ServiceReview } from './service-review.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_number', type: 'varchar', length: 32, unique: true })
  orderNumber!: string;

  @Index('idx_orders_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'org_id', type: 'uuid', nullable: true })
  orgId?: string;

  @Column({ name: 'order_type', type: 'varchar', length: 20 })
  orderType!: string;

  @Index('idx_orders_status')
  @Column({ type: 'varchar', length: 30, default: 'pending_payment' })
  status!: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  region?: string;

  @Index('idx_orders_created_at')
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'org_id' })
  organization?: Organization;

  @OneToOne(() => Payment, (payment) => payment.order)
  payment?: Payment;

  @OneToOne(() => InstallOrder, (io) => io.order)
  installOrder?: InstallOrder;

  @OneToMany(() => ServiceReview, (sr) => sr.order)
  serviceReviews?: ServiceReview[];
}
