import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetalRate } from './entities/metal-rate.entity';
import { MetalType, MetalPurity, ApprovalStatus } from '../../common/enums';

const PURITY_FACTORS: Record<MetalPurity, number> = {
  [MetalPurity.K24]: 1.0,
  [MetalPurity.K22]: 22 / 24,      // 0.91667
  [MetalPurity.K18]: 18 / 24,      // 0.75
  [MetalPurity.K14]: 14 / 24,      // 0.58333
  [MetalPurity.SILVER_999]: 1.0,
  [MetalPurity.SILVER_925]: 0.925,
  [MetalPurity.PLATINUM_950]: 0.95,
};

@Injectable()
export class MetalRatesService {
  constructor(
    @InjectRepository(MetalRate)
    private readonly rateRepo: Repository<MetalRate>,
  ) {}

  // ─── Get latest active rate for each metal+purity combo ───────────────────
  async getLatestRates() {
    const rates = await this.rateRepo
      .createQueryBuilder('r')
      .where('r.isActive = true')
      .orderBy('r.metalType', 'ASC')
      .addOrderBy('r.purity', 'ASC')
      .getMany();
    return { success: true, data: rates };
  }

  // ─── Get single current rate for a metal+purity ────────────────────────────
  async getRateForPurity(metalType: MetalType, purity: MetalPurity): Promise<MetalRate | null> {
    return this.rateRepo.findOne({
      where: { metalType, purity, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Paginated history ────────────────────────────────────────────────────
  async getHistory(query: {
    page?: number;
    limit?: number;
    metalType?: MetalType;
    purity?: MetalPurity;
  }) {
    const { page = 1, limit = 20, metalType, purity } = query;
    const qb = this.rateRepo
      .createQueryBuilder('r')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (metalType) qb.andWhere('r.metalType = :metalType', { metalType });
    if (purity) qb.andWhere('r.purity = :purity', { purity });

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Create / update rate ─────────────────────────────────────────────────
  async createRate(
    dto: {
      metalType: MetalType;
      purity: MetalPurity;
      ratePerGram: number;
      notes?: string;
      effectiveFrom?: Date;
    },
    createdById: string,
    userRole: string,
  ) {
    if (dto.ratePerGram <= 0) throw new BadRequestException('Rate per gram must be positive');

    // Find current active rate to store as previous
    const current = await this.rateRepo.findOne({
      where: { metalType: dto.metalType, purity: dto.purity, isActive: true },
    });

    // Pricing Manager & above auto-approve; others go to pending
    const autoApprove = [
      'SUPER_ADMIN', 'STORE_MANAGER', 'PRICING_MANAGER',
    ].includes(userRole);

    const rate = this.rateRepo.create({
      metalType: dto.metalType,
      purity: dto.purity,
      ratePerGram: dto.ratePerGram,
      previousRatePerGram: current?.ratePerGram ?? null,
      notes: dto.notes,
      effectiveFrom: dto.effectiveFrom ?? new Date(),
      status: autoApprove ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      isActive: autoApprove,
      createdById,
      approvedById: autoApprove ? createdById : null,
      approvedAt: autoApprove ? new Date() : null,
    });

    await this.rateRepo.save(rate);

    // If auto-approved, deactivate the previous rate
    if (autoApprove && current) {
      current.isActive = false;
      await this.rateRepo.save(current);
    }

    return {
      success: true,
      message: autoApprove ? 'Metal rate updated successfully' : 'Metal rate submitted for approval',
      data: rate,
    };
  }

  // ─── Approve a pending rate ────────────────────────────────────────────────
  async approveRate(id: string, reviewerId: string) {
    const rate = await this.rateRepo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException(`Metal rate ${id} not found`);
    if (rate.status !== ApprovalStatus.PENDING)
      throw new BadRequestException('Only PENDING rates can be approved');

    // Deactivate current active rate for same metal+purity
    const current = await this.rateRepo.findOne({
      where: { metalType: rate.metalType, purity: rate.purity, isActive: true },
    });
    if (current && current.id !== id) {
      current.isActive = false;
      await this.rateRepo.save(current);
    }

    rate.status = ApprovalStatus.APPROVED;
    rate.isActive = true;
    rate.approvedById = reviewerId;
    rate.approvedAt = new Date();
    await this.rateRepo.save(rate);

    return { success: true, message: 'Metal rate approved and activated', data: rate };
  }

  // ─── Reject a pending rate ─────────────────────────────────────────────────
  async rejectRate(id: string, reviewerId: string, reason: string) {
    const rate = await this.rateRepo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException(`Metal rate ${id} not found`);
    if (rate.status !== ApprovalStatus.PENDING)
      throw new BadRequestException('Only PENDING rates can be rejected');

    rate.status = ApprovalStatus.REJECTED;
    rate.notes = rate.notes ? `${rate.notes} | Rejection reason: ${reason}` : `Rejection reason: ${reason}`;
    rate.approvedById = reviewerId;
    rate.approvedAt = new Date();
    await this.rateRepo.save(rate);

    return { success: true, message: 'Metal rate rejected', data: rate };
  }

  // ─── Calculate derived rates from 24K base ────────────────────────────────
  calculateDerivedRates(base24KRatePerGram: number) {
    if (base24KRatePerGram <= 0) throw new BadRequestException('Base rate must be positive');

    const derived = [
      { purity: MetalPurity.K24, label: '24K Gold', factor: PURITY_FACTORS[MetalPurity.K24] },
      { purity: MetalPurity.K22, label: '22K Gold', factor: PURITY_FACTORS[MetalPurity.K22] },
      { purity: MetalPurity.K18, label: '18K Gold', factor: PURITY_FACTORS[MetalPurity.K18] },
      { purity: MetalPurity.K14, label: '14K Gold', factor: PURITY_FACTORS[MetalPurity.K14] },
    ].map((d) => ({
      ...d,
      ratePerGram: parseFloat((base24KRatePerGram * d.factor).toFixed(2)),
    }));

    return { success: true, data: { base24KRatePerGram, derived } };
  }

  async findOne(id: string) {
    const rate = await this.rateRepo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException(`Metal rate ${id} not found`);
    return { success: true, data: rate };
  }
}
