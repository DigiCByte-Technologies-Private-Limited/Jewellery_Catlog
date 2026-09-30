import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LocationType } from '../../../common/enums';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: LocationType, default: LocationType.SHOWROOM })
  type: LocationType;

  @Column({ type: 'varchar', nullable: true })
  branchCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
