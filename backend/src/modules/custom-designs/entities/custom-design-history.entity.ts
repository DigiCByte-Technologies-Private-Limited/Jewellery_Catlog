import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ActorRole, CustomDesignHistoryAction } from '../../../common/enums';
import { CustomDesignRequest } from './custom-design-request.entity';

@Entity('custom_design_request_history')
export class CustomDesignHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => CustomDesignRequest, (r) => r.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: CustomDesignRequest;

  @Column({
    type: 'enum',
    enum: ActorRole,
    default: ActorRole.ADMIN,
  })
  actorRole: ActorRole;

  @Column({ type: 'varchar', length: 255 })
  actorName: string;

  @Column({
    type: 'enum',
    enum: CustomDesignHistoryAction,
  })
  action: CustomDesignHistoryAction;

  @Column({ type: 'text' })
  note: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
