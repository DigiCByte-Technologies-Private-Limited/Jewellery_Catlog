import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StorageDriver } from '../../../common/enums';

@Entity('storage_configs')
export class StorageConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: StorageDriver,
    default: StorageDriver.LOCAL,
  })
  activeDriver: StorageDriver;

  @Column({ type: 'varchar', length: 150, nullable: true })
  bucketName: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true, default: 'ap-south-1' })
  region: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  endpoint: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  accessKeyId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  secretAccessKey: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  publicCdnUrl: string | null;

  @Column({ type: 'boolean', default: true })
  enableAutoCompression: boolean;

  @Column({ type: 'int', default: 50 })
  quotaLimitGb: number;

  @Column({ type: 'varchar', length: 50, default: 'CONNECTED' })
  connectionStatus: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  statusMessage: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastTestedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
