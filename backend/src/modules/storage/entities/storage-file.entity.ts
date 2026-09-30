import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StorageDriver, MediaCategory } from '../../../common/enums';

@Entity('storage_files')
export class StorageFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: number;

  @Column({ type: 'enum', enum: StorageDriver, default: StorageDriver.LOCAL })
  driver: StorageDriver;

  @Column({ type: 'enum', enum: MediaCategory, default: MediaCategory.PRODUCT_IMAGE })
  category: MediaCategory;

  @Column()
  publicUrl: string;

  @Column()
  storagePath: string;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'varchar', nullable: true })
  checksum: string | null;

  @Column({ type: 'varchar', nullable: true })
  uploadedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
