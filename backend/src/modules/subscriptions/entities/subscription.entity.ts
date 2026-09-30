import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionTier, SubscriptionStatus, BillingCycle } from '../../../common/enums';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Jewellery Showroom Super Tenant' })
  tenantName: string;

  @Column({ type: 'enum', enum: SubscriptionTier, default: SubscriptionTier.PROFESSIONAL })
  tier: SubscriptionTier;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.ANNUAL })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 49999.00 })
  pricePerCycle: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({ type: 'int', default: 5 })
  maxBranches: number;

  @Column({ type: 'int', default: 1 })
  currentBranches: number;

  @Column({ type: 'int', default: 25 })
  maxUsers: number;

  @Column({ type: 'int', default: 4 })
  currentUsers: number;

  @Column({ type: 'int', default: 10000 })
  maxProducts: number;

  @Column({ type: 'int', default: 12 })
  currentProducts: number;

  @Column({ type: 'int', default: 50 })
  storageQuotaGb: number;

  @Column({ type: 'json' })
  enabledFeatures: string[];

  @Column({ default: true })
  autoRenew: boolean;

  @Column({ type: 'varchar', nullable: true })
  lastPaymentReference: string | null;

  @Column({ type: 'date', nullable: true })
  lastPaymentDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
