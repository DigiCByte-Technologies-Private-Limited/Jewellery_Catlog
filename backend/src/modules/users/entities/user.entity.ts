import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { UserRole } from '../../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.SALES_STAFF })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  storeId: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  totpSecret: string | null;

  @Column({ default: false })
  isTotpEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  lastLoginIp: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
