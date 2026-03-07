import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('service_reviews')
export class ServiceReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'overall_rating', type: 'integer' })
  overallRating!: number;

  @Column({ name: 'attitude_rating', type: 'integer', nullable: true })
  attitudeRating?: number;

  @Column({ name: 'skill_rating', type: 'integer', nullable: true })
  skillRating?: number;

  @Column({ name: 'response_rating', type: 'integer', nullable: true })
  responseRating?: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Order, (order) => order.serviceReviews)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => User, (user) => user.serviceReviews)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
