import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MetalType, MetalPurity, KarigarOrderStatus } from '../../../common/enums';
import { Karigar } from './karigar.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('karigar_orders')
export class KarigarOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string; // e.g. "JO-2024-0042"

  @Column()
  karigarId: string;

  @ManyToOne(() => Karigar)
  @JoinColumn({ name: 'karigarId' })
  karigar: Karigar;

  @Column({ type: 'varchar', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'enum', enum: MetalType })
  metalType: MetalType;

  @Column({ type: 'enum', enum: MetalPurity })
  purity: MetalPurity;

  // Issued weight (gold grains/bars given to karigar)
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  issuedWeight: number;

  // Received weights
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  finishedWeight: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  scrapWeight: number;

  @Column({ type: 'decimal', precision: 7, scale: 4, default: 1.5 })
  allowedWastagePercent: number; // e.g. 1.5%

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  allowedWastageGrams: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  netDifferenceGrams: number | null; // issued - (finished + scrap + wastage)

  // Labor / Majuri payment
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  laborCharges: number;

  @Column({ type: 'enum', enum: KarigarOrderStatus, default: KarigarOrderStatus.ISSUED })
  status: KarigarOrderStatus;

  @Column({ type: 'timestamp', nullable: true })
  targetDeliveryDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
