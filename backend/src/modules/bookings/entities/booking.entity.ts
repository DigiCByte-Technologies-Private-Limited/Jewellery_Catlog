import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MetalType, MetalPurity, BookingStatus } from '../../../common/enums';
import { Customer } from '../../customers/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bookingNumber: string; // e.g. "BK-2024-0012"

  @Column()
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'varchar', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'enum', enum: MetalType })
  metalType: MetalType;

  @Column({ type: 'enum', enum: MetalPurity })
  purity: MetalPurity;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  estimatedGrossWeight: number;

  // Rate Lock Contract
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  lockedMetalRatePerGram: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  advanceAmountPaid: number;

  @Column({ default: 'UPI' })
  advancePaymentMode: string;

  @Column({ type: 'date', nullable: true })
  targetDeliveryDate: Date | null;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status: BookingStatus;

  // Final Settlement upon delivery
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  finalSettlementAmount: number | null;

  @Column({ type: 'varchar', nullable: true })
  allocatedItemTagId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
