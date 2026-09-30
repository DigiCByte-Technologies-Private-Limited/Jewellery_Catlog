import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  panNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ type: 'varchar', nullable: true })
  pincode: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'date', nullable: true })
  anniversaryDate: Date | null;

  @Column({ type: 'json', nullable: true })
  tags: string[] | null; // e.g. ["VIP", "BRIDAL"]

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalSpend: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
