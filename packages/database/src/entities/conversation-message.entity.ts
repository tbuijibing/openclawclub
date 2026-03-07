import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConversationSession } from './conversation-session.entity';

@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({ type: 'varchar', length: 10 })
  role!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'rich_elements', type: 'jsonb', nullable: true })
  richElements?: Record<string, unknown>;

  @Column({ name: 'token_usage', type: 'jsonb', nullable: true })
  tokenUsage?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => ConversationSession, (session) => session.messages)
  @JoinColumn({ name: 'session_id' })
  session!: ConversationSession;
}
