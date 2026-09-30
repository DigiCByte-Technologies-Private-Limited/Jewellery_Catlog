import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MetalType, OldGoldStatus, OldGoldPaymentMode } from '../../../common/enums';

@Entity('old_gold_transactions')
export class OldGoldTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  voucherNumber: string; // e.g. "OG-2024-001"

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ type: 'varchar', nullable: true })
  customerPan: string | null;

  @Column({ type: 'enum', enum: MetalType, default: MetalType.GOLD })
  metalType: MetalType;

  // Scale weights
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  grossWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  stoneWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  enamelLacWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  netWeight: number; // gross - stones - lac

  // Purity assessment
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  testedPurityPercent: number; // e.g. 91.60 for 22K, 75.00 for 18K

  @Column({ default: 'XRF_KARATMETER' })
  testingMethod: string; // XRF_KARATMETER, TOUCHSTONE, FIRE_ASSAY

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  meltingLossPercent: number; // e.g. 1.0%

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  netFineGoldGrams: number; // netWeight * (purity/100) * (1 - meltLoss/100)

  // Valuation
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  buyRatePerGram: number; // today's 24K buy rate

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  totalValuation: number; // netFineGoldGrams * buyRatePerGram

  @Column({ type: 'enum', enum: OldGoldPaymentMode, default: OldGoldPaymentMode.EXCHANGE_CREDIT })
  paymentMode: OldGoldPaymentMode;

  @Column({ type: 'enum', enum: OldGoldStatus, default: OldGoldStatus.ASSESSED })
  status: OldGoldStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
