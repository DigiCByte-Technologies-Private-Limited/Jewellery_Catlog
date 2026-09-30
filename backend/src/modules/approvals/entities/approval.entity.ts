import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApprovalStatus, ApprovalType } from '../../../common/enums';

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ApprovalType })
  type: ApprovalType;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column()
  requestedById: string;

  @Column({ type: 'varchar', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'varchar', nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', nullable: true })
  entityName: string | null;

  @Column({ type: 'json', nullable: true })
  payload: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
