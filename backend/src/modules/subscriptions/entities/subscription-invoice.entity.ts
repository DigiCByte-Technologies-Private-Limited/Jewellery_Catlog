import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionTier, BillingCycle } from '../../../common/enums';

@Entity('subscription_invoices')
export class SubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId: string | null;

  @Column({ type: 'enum', enum: SubscriptionTier, default: SubscriptionTier.PROFESSIONAL })
  tier: SubscriptionTier;

  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.ANNUAL })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 18.00 })
  gstRate: number; // 18% for Software SAC 997331

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  gstAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 20, default: '997331' })
  sacCode: string;

  @Column({ type: 'varchar', length: 50, default: 'PAID' })
  status: string;

  @Column({ type: 'varchar', length: 80, default: 'RAZORPAY_UPI' })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  paymentReference: string | null;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, default: '27AABCK1234F1Z5' })
  customerGstin: string | null;

  @Column({ type: 'varchar', length: 150, default: 'Kalyan Heritage Jewellers Ltd' })
  customerCompanyName: string;

  @Column({ type: 'varchar', length: 255, default: '101, Zaveri Bazaar, Kalbadevi, Mumbai 400002' })
  customerAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
