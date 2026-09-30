import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval } from './entities/approval.entity';
import { ApprovalStatus, ApprovalType } from '../../common/enums';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private readonly approvalRepo: Repository<Approval>,
  ) {}

  async create(dto: {
    type: ApprovalType;
    requestedById: string;
    entityId?: string;
    entityName?: string;
    payload?: Record<string, any>;
    comments?: string;
  }) {
    const approval = this.approvalRepo.create({
      ...dto,
      status: ApprovalStatus.PENDING,
    });
    await this.approvalRepo.save(approval);
    return { success: true, data: approval };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    type?: ApprovalType;
    status?: ApprovalStatus;
    requestedById?: string;
  }) {
    const { page = 1, limit = 20, type, status, requestedById } = query;

    const qb = this.approvalRepo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (type) qb.andWhere('a.type = :type', { type });
    if (status) qb.andWhere('a.status = :status', { status });
    if (requestedById) qb.andWhere('a.requestedById = :requestedById', { requestedById });

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException(`Approval ${id} not found`);
    return { success: true, data: approval };
  }

  async approve(id: string, reviewerId: string, comments?: string) {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException(`Approval ${id} not found`);
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }

    approval.status = ApprovalStatus.APPROVED;
    approval.reviewedById = reviewerId;
    approval.reviewedAt = new Date();
    if (comments) approval.comments = comments;
    await this.approvalRepo.save(approval);

    return { success: true, message: 'Approval granted', data: approval };
  }

  async reject(id: string, reviewerId: string, comments: string) {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException(`Approval ${id} not found`);
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }
    if (!comments || comments.trim() === '') {
      throw new BadRequestException('A rejection reason (comments) is required');
    }

    approval.status = ApprovalStatus.REJECTED;
    approval.reviewedById = reviewerId;
    approval.reviewedAt = new Date();
    approval.comments = comments;
    await this.approvalRepo.save(approval);

    return { success: true, message: 'Approval rejected', data: approval };
  }

  async getPendingCount(): Promise<number> {
    return this.approvalRepo.count({ where: { status: ApprovalStatus.PENDING } });
  }
}
