import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WholesalePartnerHistoryAction } from '../../../common/enums';
import { WholesalePartner } from './wholesale-partner.entity';

@Entity('wholesale_partner_history')
export class WholesalePartnerHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  partnerId: string;

  @ManyToOne(() => WholesalePartner, (partner) => partner.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: WholesalePartner;

  @Column({ type: 'enum', enum: WholesalePartnerHistoryAction })
  action: WholesalePartnerHistoryAction;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fromStatus: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  toStatus: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 50, default: 'SYSTEM' })
  actorRole: string;

  @Column({ type: 'varchar', length: 150, default: 'System' })
  actorName: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
