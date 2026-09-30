import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MetalType, MetalPurity, ApprovalStatus } from '../../../common/enums';

@Entity('metal_rates')
export class MetalRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MetalType })
  metalType: MetalType;

  @Column({ type: 'enum', enum: MetalPurity })
  purity: MetalPurity;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  ratePerGram: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  previousRatePerGram: number | null;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.APPROVED })
  status: ApprovalStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom: Date | null;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdById: string | null;

  @Column({ type: 'varchar', nullable: true })
  approvedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
