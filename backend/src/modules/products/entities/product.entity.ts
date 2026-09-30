import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { MetalType, MetalPurity, MetalColor, MetalFinish, ProductStatus, MakingChargeType, PricingMode, CategoryAudience, Occasion } from '../../../common/enums';
import { Category } from '../../categories/entities/category.entity';
import { ProductStone } from './product-stone.entity';
import { ProductMedia } from './product-media.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  barcode: string | null;

  @Column({ type: 'varchar', nullable: true })
  shortDescription: string | null;

  @Column({ type: 'text', nullable: true })
  longDescription: string | null;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ type: 'enum', enum: MetalType })
  metalType: MetalType;

  @Column({ type: 'enum', enum: MetalPurity })
  purity: MetalPurity;

  @Column({ type: 'enum', enum: MetalColor, nullable: true })
  metalColor: MetalColor | null;

  @Column({ type: 'enum', enum: MetalFinish, nullable: true })
  metalFinish: MetalFinish | null;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  grossWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  stoneWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  lacWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  netMetalWeight: number | null;

  @Column({ default: false })
  hasStones: boolean;

  @Column({ type: 'enum', enum: PricingMode, default: PricingMode.DYNAMIC })
  pricingMode: PricingMode;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  fixedPrice: number | null;

  @Column({ type: 'decimal', precision: 7, scale: 4, nullable: true })
  wastagePercent: number | null;

  @Column({ type: 'enum', enum: MakingChargeType, nullable: true })
  makingChargeType: MakingChargeType | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  makingChargeValue: number | null;

  @Column({ type: 'enum', enum: MakingChargeType, nullable: true })
  majuriType: MakingChargeType | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  majuriValue: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  serviceCharges: number;

  @Column({ type: 'varchar', nullable: true })
  hallmarkNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  hsnCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  countryOfOrigin: string | null;

  @Column({ type: 'text', nullable: true })
  careInstructions: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug: string | null;

  @Column({ type: 'varchar', nullable: true })
  metaTitle: string | null;

  @Column({ type: 'varchar', nullable: true })
  metaDescription: string | null;

  @Column({ type: 'enum', enum: CategoryAudience, nullable: true })
  audience: CategoryAudience | null;

  @Column({ type: 'enum', enum: Occasion, nullable: true })
  occasion: Occasion | null;

  @Column({ type: 'varchar', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @OneToMany(() => ProductStone, (stone) => stone.product, { cascade: true })
  stones: ProductStone[];

  @OneToMany(() => ProductMedia, (media) => media.product, { cascade: true })
  media: ProductMedia[];

  @Column({ type: 'varchar', nullable: true })
  createdById: string | null;

  @Column({ type: 'varchar', nullable: true })
  updatedById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
