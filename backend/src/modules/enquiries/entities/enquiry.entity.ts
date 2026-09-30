import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MetalType, Occasion, EnquiryStage } from '../../../common/enums';

@Entity('enquiries')
export class Enquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  enquiryNumber: string; // e.g. "ENQ-2024-0055"

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ type: 'varchar', nullable: true })
  customerEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  preferredCategory: string | null; // e.g. "Bridal Choker", "Men's Bracelet"

  @Column({ type: 'enum', enum: MetalType, nullable: true })
  metalType: MetalType | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  budgetMin: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  budgetMax: number | null;

  @Column({ type: 'enum', enum: Occasion, nullable: true })
  occasion: Occasion | null;

  @Column({ type: 'enum', enum: EnquiryStage, default: EnquiryStage.NEW })
  stage: EnquiryStage;

  @Column({ type: 'date', nullable: true })
  followUpDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  assignedStaffName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
