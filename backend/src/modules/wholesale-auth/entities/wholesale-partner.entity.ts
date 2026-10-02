import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { WholesaleApplicationStatus } from '../../../common/enums';
import { WholesaleDocument } from './wholesale-document.entity';
import { WholesalePartnerHistory } from './wholesale-partner-history.entity';

@Entity('wholesale_partners')
export class WholesalePartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  applicationId: string | null;

  @Column({ type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  ownerName: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  whatsappNumber: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gstNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  panNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  aadhaarNumber: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  businessType: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pincode: string | null;

  @Column({ type: 'varchar', length: 100, default: 'India' })
  country: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({
    type: 'enum',
    enum: WholesaleApplicationStatus,
    default: WholesaleApplicationStatus.PENDING_REVIEW,
  })
  status: WholesaleApplicationStatus;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resubmittedAt: Date | null;

  @OneToMany(() => WholesaleDocument, (doc) => doc.partner, { cascade: true })
  documents: WholesaleDocument[];

  @OneToMany(() => WholesalePartnerHistory, (h) => h.partner, { cascade: true })
  history: WholesalePartnerHistory[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
