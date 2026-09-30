import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { StoneType, StoneUnit, DiamondCut, DiamondClarity, DiamondColor, CertificateAuthority } from '../../../common/enums';
import { Product } from './product.entity';

@Entity('product_stones')
export class ProductStone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'enum', enum: StoneType })
  stoneType: StoneType;

  @Column({ type: 'varchar', nullable: true })
  stoneSubType: string | null;

  @Column({ default: 1 })
  count: number;

  @Column({ type: 'enum', enum: StoneUnit, default: StoneUnit.CARATS })
  unit: StoneUnit;

  @Column({ type: 'decimal', precision: 8, scale: 3 })
  weightInUnit: number;

  @Column({ type: 'decimal', precision: 8, scale: 3 })
  weightInGrams: number;

  @Column({ type: 'enum', enum: DiamondCut, nullable: true })
  cut: DiamondCut | null;

  @Column({ type: 'enum', enum: DiamondClarity, nullable: true })
  clarity: DiamondClarity | null;

  @Column({ type: 'enum', enum: DiamondColor, nullable: true })
  color: DiamondColor | null;

  @Column({ type: 'varchar', nullable: true })
  shape: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  pricePerUnit: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalStonePrice: number;

  @Column({ default: false })
  isFlatPrice: boolean;

  @Column({ type: 'enum', enum: CertificateAuthority, default: CertificateAuthority.NONE })
  certificateAuthority: CertificateAuthority;

  @Column({ type: 'varchar', nullable: true })
  certificateNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  certificateFileUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
