import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Tree, TreeChildren, TreeParent } from 'typeorm';
import { MakingChargeType } from '../../../common/enums';

@Entity('categories')
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  bannerImageUrl: string;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ type: 'decimal', precision: 7, scale: 4, nullable: true })
  defaultWastagePercent: number;

  @Column({ type: 'enum', enum: MakingChargeType, nullable: true })
  defaultMakingChargeType: MakingChargeType;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  defaultMakingChargeValue: number;

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ nullable: true })
  createdById: string;

  @Column({ nullable: true })
  updatedById: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
