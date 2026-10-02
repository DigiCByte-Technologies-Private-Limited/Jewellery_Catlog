import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { WholesaleSubmissionStatus } from '../../../common/enums';
import { WholesaleSubmissionHistory } from './wholesale-submission-history.entity';

export interface SubmittedImageItem {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  imageTitle?: string;
  imageDescription?: string;
  sourceReference?: string;
}

@Entity('wholesale_product_submissions')
export class WholesaleProductSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, unique: true })
  submissionId: string; // e.g. "WPS-2026-0001"

  @Column({ type: 'uuid', nullable: true })
  wholesaleUserId: string | null;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  productSku: string | null;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  productCategory: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  productSubcategory: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  brandOrManufacturer: string | null;

  @Column({ type: 'text', nullable: true })
  productDescription: string | null;

  @Column({ type: 'text', nullable: true })
  productSpecifications: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dimensions: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  colorOrVariant: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  wholesaleQuantity: string | null;

  @Column({ type: 'text', nullable: true })
  additionalNotes: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: SubmittedImageItem[];

  @Index()
  @Column({
    type: 'enum',
    enum: WholesaleSubmissionStatus,
    default: WholesaleSubmissionStatus.PENDING_REVIEW,
  })
  status: WholesaleSubmissionStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @Column({ type: 'uuid', nullable: true })
  publishedToProductId: string | null;

  @Column({ type: 'varchar', length: 255, default: 'PENDING' })
  notificationStatus: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewedByName: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @OneToMany(() => WholesaleSubmissionHistory, (h) => h.submission, { cascade: true })
  history: WholesaleSubmissionHistory[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
