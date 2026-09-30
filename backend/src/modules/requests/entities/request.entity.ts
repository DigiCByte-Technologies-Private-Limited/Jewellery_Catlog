import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  RequestStatus,
  RequestPriority,
  PreferredContactMethod,
  PurchaseStatus,
} from '../../../common/enums';
import { Product } from '../../products/entities/product.entity';
import { Store } from '../../stores/entities/store.entity';
import { RequestHistory } from './request-history.entity';

@Entity('product_requests')
export class ProductRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, unique: true })
  requestId: string; // e.g. "REQ-000124"

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  quantity: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number | null;

  @Column({
    type: 'enum',
    enum: PreferredContactMethod,
    default: PreferredContactMethod.EMAIL,
  })
  preferredContactMethod: PreferredContactMethod;

  @Column({ type: 'text', nullable: true })
  technicalRequirement: string | null;

  // 1. Operational Request Lifecycle Status
  @Index()
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.NEW,
  })
  status: RequestStatus;

  // 2. Final Customer Commercial Purchase Status
  @Index()
  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  purchaseStatus: PurchaseStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  purchaseReason: string | null;

  @Column({ type: 'text', nullable: true })
  purchaseNotes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  purchaseConfirmedAt: Date | null;

  // Store Assignment
  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedStoreId: string | null;

  @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedStoreId' })
  assignedStore: Store | null;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  followUpAt: Date | null;

  @Index()
  @Column({
    type: 'enum',
    enum: RequestPriority,
    default: RequestPriority.NORMAL,
  })
  priority: RequestPriority;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId: string | null;

  @OneToMany(() => RequestHistory, (history) => history.request, { cascade: true })
  history: RequestHistory[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
