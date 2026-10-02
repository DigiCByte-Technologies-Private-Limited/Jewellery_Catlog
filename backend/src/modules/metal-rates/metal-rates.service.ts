import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetalRate } from './entities/metal-rate.entity';
import { Product } from '../products/entities/product.entity';
import { ProductStone } from '../products/entities/product-stone.entity';
import { MetalType, MetalPurity, ApprovalStatus, PricingMode } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { PricingCalculatorService } from '../pricing/pricing-calculator.service';

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
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly auditService: AuditService,
    private readonly pricingService: PricingCalculatorService,
  ) {}

  // ─── Get latest active rate for each metal+purity combo ───────────────────
  async getLatestRates() {
    const rates = await this.rateRepo
      .createQueryBuilder('r')
      .where('r.isActive = true')
      .orderBy('r.metalType', 'ASC')
      .addOrderBy('r.purity', 'ASC')
      .getMany();

    // Attach count of active products utilizing each rate
    const enrichedRates = await Promise.all(
      rates.map(async (rate) => {
        const count = await this.productRepo.count({
          where: {
            metalType: rate.metalType,
            purity: rate.purity,
            pricingMode: PricingMode.DYNAMIC,
          },
        });
        return {
          ...rate,
          productsCount: count,
        };
      }),
    );

    return { success: true, data: enrichedRates };
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

  // ─── Rate Change Impact Preview ──────────────────────────────────────────
  async getImpactPreview(metalType: MetalType, purity: MetalPurity, newRatePerGram: number) {
    if (!newRatePerGram || isNaN(newRatePerGram) || newRatePerGram <= 0) {
      throw new BadRequestException('New rate per gram must be a positive number');
    }

    const currentRate = await this.getRateForPurity(metalType, purity);
    const currentRateValue = currentRate ? Number(currentRate.ratePerGram) : 0;
    const rateDiff = parseFloat((newRatePerGram - currentRateValue).toFixed(2));
    const ratePercentageChange = currentRateValue > 0
      ? parseFloat(((rateDiff / currentRateValue) * 100).toFixed(2))
      : 100;

    // Fetch all active products matching this metalType + purity
    const products = await this.productRepo.find({
      where: {
        metalType,
        purity,
        pricingMode: PricingMode.DYNAMIC,
      },
      relations: { stones: true },
    });

    let totalCurrentValue = 0;
    let totalNewValue = 0;
    const sampleProducts: any[] = [];

    for (const p of products) {
      const totalStoneValue = (p.stones || []).reduce(
        (sum: number, s: ProductStone) => sum + Number(s.totalStonePrice || 0),
        0,
      );

      // Old price calculation
      const oldBreakdown = this.pricingService.calculate({
        pricingMode: p.pricingMode,
        fixedPrice: p.fixedPrice ? Number(p.fixedPrice) : undefined,
        grossWeight: Number(p.grossWeight),
        stoneWeight: p.hasStones ? Number(p.stoneWeight ?? 0) : 0,
        lacWeight: Number(p.lacWeight ?? 0),
        metalRatePerGram: currentRateValue,
        wastagePercent: p.wastagePercent ? Number(p.wastagePercent) : 0,
        makingChargeType: p.makingChargeType ?? undefined,
        makingChargeValue: p.makingChargeValue ? Number(p.makingChargeValue) : 0,
        majuriType: p.majuriType ?? undefined,
        majuriValue: p.majuriValue ? Number(p.majuriValue) : 0,
        serviceCharges: p.serviceCharges ? Number(p.serviceCharges) : 0,
        totalStoneValue,
        gstRatePercent: 3,
        roundTo: 1,
      });

      // New price calculation
      const newBreakdown = this.pricingService.calculate({
        pricingMode: p.pricingMode,
        fixedPrice: p.fixedPrice ? Number(p.fixedPrice) : undefined,
        grossWeight: Number(p.grossWeight),
        stoneWeight: p.hasStones ? Number(p.stoneWeight ?? 0) : 0,
        lacWeight: Number(p.lacWeight ?? 0),
        metalRatePerGram: newRatePerGram,
        wastagePercent: p.wastagePercent ? Number(p.wastagePercent) : 0,
        makingChargeType: p.makingChargeType ?? undefined,
        makingChargeValue: p.makingChargeValue ? Number(p.makingChargeValue) : 0,
        majuriType: p.majuriType ?? undefined,
        majuriValue: p.majuriValue ? Number(p.majuriValue) : 0,
        serviceCharges: p.serviceCharges ? Number(p.serviceCharges) : 0,
        totalStoneValue,
        gstRatePercent: 3,
        roundTo: 1,
      });

      totalCurrentValue += oldBreakdown.finalPriceRounded;
      totalNewValue += newBreakdown.finalPriceRounded;

      if (sampleProducts.length < 6) {
        sampleProducts.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          grossWeight: Number(p.grossWeight),
          netMetalWeight: Number(p.netMetalWeight || p.grossWeight),
          oldPrice: oldBreakdown.finalPriceRounded,
          newPrice: newBreakdown.finalPriceRounded,
          difference: newBreakdown.finalPriceRounded - oldBreakdown.finalPriceRounded,
        });
      }
    }

    return {
      success: true,
      data: {
        metalType,
        purity,
        currentRatePerGram: currentRateValue,
        newRatePerGram: parseFloat(newRatePerGram.toFixed(2)),
        rateDifference: rateDiff,
        ratePercentageChange,
        affectedProductsCount: products.length,
        totalCurrentValue: Math.round(totalCurrentValue),
        totalNewValue: Math.round(totalNewValue),
        totalValueChange: Math.round(totalNewValue - totalCurrentValue),
        sampleProducts,
      },
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
    if (!dto.ratePerGram || isNaN(dto.ratePerGram) || dto.ratePerGram <= 0) {
      throw new BadRequestException('Rate per gram must be a positive number');
    }

    const cleanRate = parseFloat(Number(dto.ratePerGram).toFixed(2));

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
      ratePerGram: cleanRate,
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

    // Audit log
    await this.auditService.log({
      userId: createdById,
      action: 'RATE_UPDATE',
      entityName: 'MetalRate',
      entityId: rate.id,
      before: current ? { ratePerGram: current.ratePerGram, purity: current.purity, metalType: current.metalType } : undefined,
      after: { ratePerGram: rate.ratePerGram, purity: rate.purity, metalType: rate.metalType, status: rate.status },
      notes: dto.notes,
    });

    return {
      success: true,
      message: autoApprove ? 'Metal rate updated and activated successfully' : 'Metal rate submitted for approval',
      data: rate,
    };
  }

  // ─── Update an existing rate by ID ─────────────────────────────────────────
  async updateRate(
    id: string,
    dto: { ratePerGram: number; notes?: string; effectiveFrom?: Date },
    userId: string,
    userRole: string,
  ) {
    const rate = await this.rateRepo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException(`Metal rate ${id} not found`);

    if (!dto.ratePerGram || isNaN(dto.ratePerGram) || dto.ratePerGram <= 0) {
      throw new BadRequestException('Rate per gram must be a positive number');
    }

    const previousRate = rate.ratePerGram;
    const cleanRate = parseFloat(Number(dto.ratePerGram).toFixed(2));

    const autoApprove = [
      'SUPER_ADMIN', 'STORE_MANAGER', 'PRICING_MANAGER',
    ].includes(userRole);

    rate.previousRatePerGram = previousRate;
    rate.ratePerGram = cleanRate;
    if (dto.notes) rate.notes = dto.notes;
    if (dto.effectiveFrom) rate.effectiveFrom = dto.effectiveFrom;

    if (autoApprove) {
      rate.status = ApprovalStatus.APPROVED;
      rate.isActive = true;
      rate.approvedById = userId;
      rate.approvedAt = new Date();

      // Deactivate any other active rates for this metalType & purity
      await this.rateRepo
        .createQueryBuilder()
        .update(MetalRate)
        .set({ isActive: false })
        .where('metalType = :metalType AND purity = :purity AND id != :id AND isActive = true', {
          metalType: rate.metalType,
          purity: rate.purity,
          id: rate.id,
        })
        .execute();
    }

    await this.rateRepo.save(rate);

    await this.auditService.log({
      userId,
      action: 'RATE_EDIT',
      entityName: 'MetalRate',
      entityId: rate.id,
      before: { ratePerGram: previousRate },
      after: { ratePerGram: rate.ratePerGram, notes: rate.notes },
      notes: dto.notes,
    });

    return {
      success: true,
      message: 'Metal rate updated successfully',
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

    await this.auditService.log({
      userId: reviewerId,
      action: 'RATE_APPROVED',
      entityName: 'MetalRate',
      entityId: rate.id,
      after: { ratePerGram: rate.ratePerGram, purity: rate.purity, metalType: rate.metalType },
    });

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

    await this.auditService.log({
      userId: reviewerId,
      action: 'RATE_REJECTED',
      entityName: 'MetalRate',
      entityId: rate.id,
      notes: reason,
    });

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
