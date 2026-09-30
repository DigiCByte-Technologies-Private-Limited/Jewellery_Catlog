import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_media')
export class ProductMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  originalUrl: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  standardUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  hiResUrl: string | null;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ type: 'varchar', nullable: true })
  altText: string | null;

  @Column({ default: 'image' })
  mediaType: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'int', nullable: true })
  fileSize: number | null;

  @Column({ type: 'varchar', nullable: true })
  mimeType: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
