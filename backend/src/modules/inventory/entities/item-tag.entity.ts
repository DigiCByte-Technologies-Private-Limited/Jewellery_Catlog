import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ItemTagStatus } from '../../../common/enums';
import { Product } from '../../products/entities/product.entity';
import { Location } from './location.entity';

@Entity('item_tags')
export class ItemTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tagNumber: string; // barcode / tag number e.g. "TAG-2024-00124"

  @Column({ type: 'varchar', nullable: true, unique: true })
  huid: string | null; // 6-character BIS Hallmark Unique Identification

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  grossWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  stoneWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  lacWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  netMetalWeight: number;

  @Column({ type: 'enum', enum: ItemTagStatus, default: ItemTagStatus.IN_STOCK })
  status: ItemTagStatus;

  @Column()
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column({ type: 'varchar', nullable: true })
  trayNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  rfidCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  memoHolderName: string | null;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
