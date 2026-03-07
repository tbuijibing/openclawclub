import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EnterpriseInfo } from './enterprise-info.entity';
import { Order } from './order.entity';
import { Subscription } from './subscription.entity';
import { Ticket } from './ticket.entity';
import { Certificate } from './certificate.entity';
import { TokenAccount } from './token-account.entity';
import { ConversationSession } from './conversation-session.entity';
import { ServiceReview } from './service-review.entity';
import { PartnerEarning } from './partner-earning.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'logto_user_id', type: 'varchar', length: 64, unique: true })
  logtoUserId!: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20 })
  accountType!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 100, nullable: true })
  displayName?: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'language_preference', type: 'varchar', length: 5, default: 'en' })
  languagePreference!: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  region?: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 128, nullable: true })
  passwordHash?: string;

  @Column({ type: 'varchar', length: 20, default: 'individual_user' })
  role!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => EnterpriseInfo, (ei) => ei.user)
  enterpriseInfo?: EnterpriseInfo;

  @OneToMany(() => Order, (order) => order.user)
  orders?: Order[];

  @OneToMany(() => Subscription, (sub) => sub.user)
  subscriptions?: Subscription[];

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets?: Ticket[];

  @OneToMany(() => Certificate, (cert) => cert.user)
  certificates?: Certificate[];

  @OneToMany(() => TokenAccount, (ta) => ta.user)
  tokenAccounts?: TokenAccount[];

  @OneToMany(() => ConversationSession, (cs) => cs.user)
  conversationSessions?: ConversationSession[];

  @OneToMany(() => ServiceReview, (sr) => sr.user)
  serviceReviews?: ServiceReview[];

  @OneToMany(() => PartnerEarning, (pe) => pe.partner)
  partnerEarnings?: PartnerEarning[];
}
