import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('enterprise_info')
export class EnterpriseInfo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'org_id', type: 'uuid', nullable: true })
  orgId?: string;

  @Column({ name: 'company_name', type: 'varchar', length: 200 })
  companyName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  industry?: string;

  @Column({ name: 'company_size', type: 'varchar', length: 20, nullable: true })
  companySize?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.enterpriseInfo)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'org_id' })
  organization?: Organization;
}
