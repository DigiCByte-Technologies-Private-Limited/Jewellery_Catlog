import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogEntry {
  userId: string;
  userEmail?: string;
  action: string;
  entityName: string;
  entityId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const log = this.auditRepo.create(entry);
      await this.auditRepo.save(log);
    } catch {
      // Audit log failures must never crash the main operation
      console.error('[AuditService] Failed to write audit log:', entry);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    userId?: string;
    entityName?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page = 1, limit = 50, userId, entityName, action, dateFrom, dateTo } = query;

    const qb = this.auditRepo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userId) qb.andWhere('a.userId = :userId', { userId });
    if (entityName) qb.andWhere('LOWER(a.entityName) = :entityName', { entityName: entityName.toLowerCase() });
    if (action) qb.andWhere('a.action = :action', { action });
    if (dateFrom) qb.andWhere('a.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb.andWhere('a.createdAt <= :dateTo', { dateTo: new Date(dateTo) });

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
