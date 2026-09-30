import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ActorRole, RequestHistoryAction } from '../../../common/enums';
import { ProductRequest } from './request.entity';

@Entity('request_history')
export class RequestHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => ProductRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: ProductRequest;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({
    type: 'enum',
    enum: ActorRole,
    default: ActorRole.CUSTOMER,
  })
  actorRole: ActorRole;

  @Column({ type: 'varchar', length: 255 })
  actorName: string;

  @Column({
    type: 'enum',
    enum: RequestHistoryAction,
  })
  action: RequestHistoryAction;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
