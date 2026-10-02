import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WholesaleDocumentType, WholesaleDocumentStatus } from '../../../common/enums';
import { WholesalePartner } from './wholesale-partner.entity';

@Entity('wholesale_documents')
export class WholesaleDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  partnerId: string;

  @ManyToOne(() => WholesalePartner, (partner) => partner.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: WholesalePartner;

  @Column({ type: 'enum', enum: WholesaleDocumentType })
  documentType: WholesaleDocumentType;

  @Column({ type: 'varchar', length: 255 })
  originalFilename: string;

  @Column({ type: 'varchar', length: 255 })
  storageFileName: string;

  @Column({ type: 'varchar', length: 500 })
  storagePath: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: number;

  @Column({
    type: 'enum',
    enum: WholesaleDocumentStatus,
    default: WholesaleDocumentStatus.PENDING,
  })
  status: WholesaleDocumentStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  verifiedById: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
