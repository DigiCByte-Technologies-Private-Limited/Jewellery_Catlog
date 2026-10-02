import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WholesaleSubmissionHistoryAction, ActorRole } from '../../../common/enums';
import { WholesaleProductSubmission } from './wholesale-product-submission.entity';

@Entity('wholesale_submission_history')
export class WholesaleSubmissionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  submissionDbId: string;

  @ManyToOne(() => WholesaleProductSubmission, (sub) => sub.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionDbId' })
  submission: WholesaleProductSubmission;

  @Column({
    type: 'enum',
    enum: ActorRole,
    default: ActorRole.ADMIN,
  })
  actorRole: ActorRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actorName: string | null;

  @Column({
    type: 'enum',
    enum: WholesaleSubmissionHistoryAction,
  })
  action: WholesaleSubmissionHistoryAction;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
