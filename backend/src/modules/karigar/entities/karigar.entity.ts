import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('karigars')
export class Karigar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string; // e.g. "KRG-001"

  @Column()
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  panNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  skills: string | null; // e.g. "Handmade Chains, Kundan Setting, Casting"

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  goldBalanceGrams: number; // net gold currently held/owed

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  silverBalanceGrams: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  defaultMakingChargeRate: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
