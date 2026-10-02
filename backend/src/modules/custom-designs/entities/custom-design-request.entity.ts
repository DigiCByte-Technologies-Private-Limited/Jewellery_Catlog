import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import {
  PreferredContactMethod,
  CustomDesignStatus,
} from '../../../common/enums';
import { CustomDesignHistory } from './custom-design-history.entity';

export interface AttachmentFileItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  filename?: string;
}

@Entity('custom_design_requests')
export class CustomDesignRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, unique: true })
  requestId: string; // e.g. "CDR-2026-0001"

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'varchar', length: 255, default: 'Custom Bespoke Jewelry' })
  productName: string;

  @Column({ type: 'text' })
  designDescription: string;

  @Column({ type: 'text', nullable: true })
  designRequirements: string | null;

  @Column({ type: 'varchar', length: 100, default: '1' })
  quantity: string | null;

  @Column({ type: 'text', nullable: true })
  materialRequirements: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dimensions: string | null;

  @Column({ type: 'text', nullable: true })
  additionalNotes: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments: AttachmentFileItem[];

  @Column({
    type: 'enum',
    enum: PreferredContactMethod,
    default: PreferredContactMethod.EMAIL,
  })
  preferredContactMethod: PreferredContactMethod;

  @Index()
  @Column({
    type: 'enum',
    enum: CustomDesignStatus,
    default: CustomDesignStatus.NEW,
  })
  status: CustomDesignStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @Column({ type: 'varchar', length: 255, default: 'PENDING' })
  notificationStatus: string;

  @OneToMany(() => CustomDesignHistory, (h) => h.request, { cascade: true })
  history: CustomDesignHistory[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
