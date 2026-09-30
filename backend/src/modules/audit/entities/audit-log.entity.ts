import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  userEmail: string | null;

  @Column()
  action: string;

  @Column()
  entityName: string;

  @Column({ type: 'varchar', nullable: true })
  entityId: string | null;

  @Column({ type: 'json', nullable: true })
  before: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  after: Record<string, any> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
