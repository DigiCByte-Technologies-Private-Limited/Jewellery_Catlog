import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductStone } from './entities/product-stone.entity';
import { ProductMedia } from './entities/product-media.entity';
import { MetalRatesService } from '../metal-rates/metal-rates.service';
import { PricingCalculatorService } from '../pricing/pricing-calculator.service';
import { AuditService } from '../audit/audit.service';
import {
  ProductStatus,
  MetalType,
  MetalPurity,
  PricingMode,
  MakingChargeType,
  StoneUnit,
  UserRole,
} from '../../common/enums';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function generateSku(name: string): string {
  const prefix = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4);
  const suffix = Date.now().toString(36).toUpperCase().slice(-5);
  return `${prefix}-${suffix}`;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductStone)
    private readonly stoneRepo: Repository<ProductStone>,
    @InjectRepository(ProductMedia)
    private readonly mediaRepo: Repository<ProductMedia>,
    private readonly metalRatesService: MetalRatesService,
    private readonly pricingService: PricingCalculatorService,
    private readonly auditService: AuditService,
  ) {}

  // ─── LIST WITH DYNAMIC PRICING & MULTI-FILTERS ───────────────────────────
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    metalType?: MetalType;
    purity?: MetalPurity;
    status?: ProductStatus;
    categoryId?: string;
    hasStones?: boolean;
    audience?: string;
    occasion?: string;
    minWeight?: number;
    maxWeight?: number;
    weightRange?: string;
    minPrice?: number;
    maxPrice?: number;
    priceRange?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      metalType,
      purity,
      status,
      categoryId,
      hasStones,
      audience,
      occasion,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // Weight range parsing
    let minW = query.minWeight !== undefined ? Number(query.minWeight) : undefined;
    let maxW = query.maxWeight !== undefined ? Number(query.maxWeight) : undefined;
    if (query.weightRange) {
      const wr = query.weightRange.trim();
      if (wr === '0-5') { minW = 0; maxW = 5; }
      else if (wr === '5-10') { minW = 5; maxW = 10; }
      else if (wr === '10-20') { minW = 10; maxW = 20; }
      else if (wr === '20-50') { minW = 20; maxW = 50; }
      else if (wr === '50+' || wr.startsWith('50')) { minW = 50; }
    }

    // Price range parsing
    let minP = query.minPrice !== undefined ? Number(query.minPrice) : undefined;
    let maxP = query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;
    if (query.priceRange) {
      const pr = query.priceRange.trim();
      if (pr === 'under-25k' || pr === '0-25k') { minP = 0; maxP = 25000; }
      else if (pr === '25k-50k') { minP = 25000; maxP = 50000; }
      else if (pr === '50k-100k') { minP = 50000; maxP = 100000; }
      else if (pr === '100k+' || pr === 'above-100k' || pr.startsWith('100k')) { minP = 100000; }
    }

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.media', 'media')
      .leftJoinAndSelect('p.stones', 'stones')
      .where('p.deletedAt IS NULL');

    if (search) {
      qb.andWhere('(LOWER(p.name) LIKE :search OR LOWER(p.sku) LIKE :search)', {
        search: `%${search.toLowerCase()}%`,
      });
    }
    if (metalType) qb.andWhere('p.metalType = :metalType', { metalType });
    if (purity) qb.andWhere('p.purity = :purity', { purity });
    if (status) qb.andWhere('p.status = :status', { status });
    if (categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId });
    if (hasStones !== undefined) qb.andWhere('p.hasStones = :hasStones', { hasStones });
    if (audience) qb.andWhere('p.audience = :audience', { audience });
    if (occasion) qb.andWhere('p.occasion = :occasion', { occasion });
    if (minW !== undefined) qb.andWhere('p.grossWeight >= :minW', { minW });
    if (maxW !== undefined) qb.andWhere('p.grossWeight <= :maxW', { maxW });

    // Fetch active metal rates once for dynamic calculation across all products
    const ratesRes = await this.metalRatesService.getLatestRates();
    const ratesMap = new Map<string, any>();
    for (const r of ratesRes.data || []) {
      ratesMap.set(`${r.metalType}_${r.purity}`, r);
    }

    // Dynamic price filtering or price sorting requires in-memory calculation
    if (minP !== undefined || maxP !== undefined || sortBy === 'price') {
      const allCandidates = await qb.getMany();
      let enriched = allCandidates.map((p) => this._enrichProductWithPrice(p, ratesMap));

      if (minP !== undefined) enriched = enriched.filter((p) => p.currentPrice >= minP!);
      if (maxP !== undefined) enriched = enriched.filter((p) => p.currentPrice <= maxP!);

      if (sortBy === 'price') {
        enriched.sort((a, b) =>
          sortOrder === 'ASC' ? a.currentPrice - b.currentPrice : b.currentPrice - a.currentPrice,
        );
      } else {
        enriched.sort((a: any, b: any) => {
          const valA = a[sortBy] ?? '';
          const valB = b[sortBy] ?? '';
          if (sortOrder === 'ASC') return valA > valB ? 1 : -1;
          return valA < valB ? 1 : -1;
        });
      }

      const total = enriched.length;
      const paginatedData = enriched.slice((page - 1) * limit, page * limit);
      return {
        success: true,
        data: paginatedData,
        meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      };
    }

    // Standard SQL pagination when no price filter is applied
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy(`p.${sortBy}`, sortOrder);

    const [data, total] = await qb.getManyAndCount();
    const enrichedData = data.map((p) => this._enrichProductWithPrice(p, ratesMap));

    return {
      success: true,
      data: enrichedData,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  // ─── GET ONE WITH CURRENT DYNAMIC PRICE ────────────────────────────────────
  async findOne(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { category: true, stones: true, media: true },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    const ratesRes = await this.metalRatesService.getLatestRates();
    const ratesMap = new Map<string, any>();
    for (const r of ratesRes.data || []) {
      ratesMap.set(`${r.metalType}_${r.purity}`, r);
    }

    const enriched = this._enrichProductWithPrice(product, ratesMap);
    return { success: true, data: enriched };
  }

  // ─── PRIVATE HELPER: DYNAMIC PRICE ENRICHMENT ─────────────────────────────
  private _enrichProductWithPrice(product: Product, ratesMap: Map<string, any>) {
    const rate = ratesMap.get(`${product.metalType}_${product.purity}`);
    const metalRatePerGram = rate ? Number(rate.ratePerGram) : 0;

    const totalStoneValue = (product.stones || []).reduce(
      (sum: number, s: ProductStone) => sum + Number(s.totalStonePrice || 0),
      0,
    );

    const breakdown = this.pricingService.calculate({
      pricingMode: product.pricingMode,
      fixedPrice: product.fixedPrice ? Number(product.fixedPrice) : undefined,
      grossWeight: Number(product.grossWeight),
      stoneWeight: product.hasStones ? Number(product.stoneWeight ?? 0) : 0,
      lacWeight: Number(product.lacWeight ?? 0),
      metalRatePerGram,
      wastagePercent: product.wastagePercent ? Number(product.wastagePercent) : 0,
      makingChargeType: product.makingChargeType ?? undefined,
      makingChargeValue: product.makingChargeValue ? Number(product.makingChargeValue) : 0,
      majuriType: product.majuriType ?? undefined,
      majuriValue: product.majuriValue ? Number(product.majuriValue) : 0,
      serviceCharges: product.serviceCharges ? Number(product.serviceCharges) : 0,
      totalStoneValue,
      gstRatePercent: 3,
      roundTo: 1,
    });

    return {
      ...product,
      currentPrice: breakdown.finalPriceRounded,
      calculatedPrice: breakdown.finalPriceRounded,
      priceBreakdown: breakdown,
      metalRate: rate
        ? {
            ratePerGram: Number(rate.ratePerGram),
            purity: rate.purity,
            metalType: rate.metalType,
            updatedAt: rate.updatedAt,
          }
        : null,
    };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(dto: any, userId: string) {
    // Validate weights
    const stoneWeight = dto.stoneWeight ?? 0;
    const lacWeight = dto.lacWeight ?? 0;
    if (stoneWeight + lacWeight > dto.grossWeight) {
      throw new BadRequestException(
        'Stone weight + lac weight cannot exceed gross weight',
      );
    }

    // Auto-generate SKU if not provided
    const sku = dto.sku || generateSku(dto.name);

    // Check SKU uniqueness
    const existing = await this.productRepo.findOne({ where: { sku }, withDeleted: true });
    if (existing) throw new ConflictException(`SKU '${sku}' already exists`);

    // Auto-generate slug
    const baseSlug = slugify(dto.name);
    let slug = baseSlug;
    const slugExists = await this.productRepo.findOne({ where: { slug }, withDeleted: true });
    if (slugExists) slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Compute net metal weight in service (not DB generated column)
    const netMetalWeight = Number(dto.grossWeight) - stoneWeight - lacWeight;

    let makingChargeType = dto.makingChargeType;
    if ((makingChargeType as any) === 'PERCENT') makingChargeType = MakingChargeType.PERCENTAGE;

    let majuriType = dto.majuriType;
    if ((majuriType as any) === 'PERCENT') majuriType = MakingChargeType.PERCENTAGE;

    const product = this.productRepo.create({
      ...dto,
      sku,
      slug,
      netMetalWeight,
      stoneWeight,
      lacWeight,
      makingChargeType,
      majuriType,
      createdById: userId,
      updatedById: userId,
    } as any) as unknown as Product;

    await this.productRepo.save(product);

    // Save stones if provided
    if (dto.hasStones && dto.stones?.length > 0) {
      await this._saveStones(product.id, dto.stones);
    }

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityName: 'Product',
      entityId: product.id,
      after: { sku: product.sku, name: product.name, status: product.status },
    });

    return { success: true, message: 'Product created successfully', data: product };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(id: string, dto: any, userId: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    const before = {
      name: product.name,
      status: product.status,
      grossWeight: product.grossWeight,
    };

    // Recalculate net metal weight on weight changes
    if (dto.grossWeight !== undefined || dto.stoneWeight !== undefined || dto.lacWeight !== undefined) {
      const grossWeight = dto.grossWeight ?? product.grossWeight;
      const stoneWeight = dto.stoneWeight ?? product.stoneWeight ?? 0;
      const lacWeight = dto.lacWeight ?? product.lacWeight ?? 0;

      if (stoneWeight + lacWeight > grossWeight) {
        throw new BadRequestException('Stone weight + lac weight cannot exceed gross weight');
      }
      dto.netMetalWeight = Number(grossWeight) - stoneWeight - lacWeight;
    }

    Object.assign(product, { ...dto, updatedById: userId });
    await this.productRepo.save(product);

    // Update stones if provided
    if (dto.stones !== undefined) {
      // Remove old stones and re-save
      await this.stoneRepo.delete({ productId: product.id });
      if (product.hasStones && dto.stones?.length > 0) {
        await this._saveStones(product.id, dto.stones);
      }
    }

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityName: 'Product',
      entityId: product.id,
      before,
      after: { name: product.name, status: product.status, grossWeight: product.grossWeight },
    });

    return { success: true, message: 'Product updated successfully', data: product };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    // Business rule: cannot delete published products — archive instead
    if (product.status === ProductStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot delete a published product. Archive it first.',
      );
    }

    await this.productRepo.softDelete(id);
    await this.auditService.log({
      userId,
      action: 'DELETE',
      entityName: 'Product',
      entityId: id,
      before: { name: product.name, sku: product.sku, status: product.status },
    });

    return { success: true, message: 'Product deleted successfully' };
  }

  // ─── CHANGE STATUS ────────────────────────────────────────────────────────
  async changeStatus(id: string, status: ProductStatus, userId: string, userRole: string) {
    const product = await this.productRepo.findOne({ where: { id }, relations: { media: true } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    // Validate publish requirements
    if (status === ProductStatus.PUBLISHED) {
      if (!product.media || product.media.length === 0) {
        throw new BadRequestException('Cannot publish a product without at least one image');
      }
      if (!product.metalType || !product.purity || !product.grossWeight) {
        throw new BadRequestException('Cannot publish a product without metal type, purity and gross weight');
      }
    }

    const before = { status: product.status };
    product.status = status;
    product.updatedById = userId;
    await this.productRepo.save(product);

    await this.auditService.log({
      userId,
      action: 'STATUS_CHANGE',
      entityName: 'Product',
      entityId: id,
      before,
      after: { status },
    });

    return { success: true, message: `Product status changed to ${status}`, data: { id, status } };
  }

  // ─── DUPLICATE ────────────────────────────────────────────────────────────
  async duplicate(id: string, userId: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { stones: true },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    const newSku = `${product.sku}-COPY-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    const newSlug = `${product.slug}-copy-${Date.now()}`;

    const { id: _id, createdAt: _ca, updatedAt: _ua, stones, ...productData } = product as any;

    const newProduct = this.productRepo.create({
      ...productData,
      sku: newSku,
      slug: newSlug,
      status: ProductStatus.DRAFT,
      createdById: userId,
      updatedById: userId,
    } as any) as unknown as Product;

    await this.productRepo.save(newProduct);

    // Duplicate stones
    if (stones?.length > 0) {
      await this._saveStones(newProduct.id, stones);
    }

    return { success: true, message: 'Product duplicated successfully', data: newProduct };
  }

  // ─── PRICE BREAKDOWN ──────────────────────────────────────────────────────
  async getPriceBreakdown(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { stones: true },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    // Fetch current metal rate
    const metalRate = await this.metalRatesService.getRateForPurity(
      product.metalType,
      product.purity,
    );

    if (!metalRate && product.pricingMode === PricingMode.DYNAMIC) {
      return {
        success: false,
        message: `No active metal rate found for ${product.metalType} ${product.purity}. Please set a current rate first.`,
        data: null,
      };
    }

    // Sum stone values
    const totalStoneValue = (product.stones || []).reduce(
      (sum: number, s: ProductStone) => sum + Number(s.totalStonePrice),
      0,
    );

    const breakdown = this.pricingService.calculate({
      pricingMode: product.pricingMode,
      fixedPrice: product.fixedPrice ? Number(product.fixedPrice) : undefined,
      grossWeight: Number(product.grossWeight),
      stoneWeight: product.hasStones ? Number(product.stoneWeight ?? 0) : 0,
      lacWeight: Number(product.lacWeight ?? 0),
      metalRatePerGram: metalRate ? Number(metalRate.ratePerGram) : 0,
      wastagePercent: product.wastagePercent ? Number(product.wastagePercent) : 0,
      makingChargeType: product.makingChargeType ?? undefined,
      makingChargeValue: product.makingChargeValue ? Number(product.makingChargeValue) : 0,
      majuriType: product.majuriType ?? undefined,
      majuriValue: product.majuriValue ? Number(product.majuriValue) : 0,
      serviceCharges: product.serviceCharges ? Number(product.serviceCharges) : 0,
      totalStoneValue,
      gstRatePercent: 3,
      roundTo: 1,
    });

    return {
      success: true,
      data: {
        product: { id: product.id, name: product.name, sku: product.sku },
        metalRate: metalRate
          ? { ratePerGram: metalRate.ratePerGram, purity: metalRate.purity, updatedAt: metalRate.updatedAt }
          : null,
        breakdown,
        calculatedAt: new Date().toISOString(),
      },
    };
  }

  // ─── BULK STATUS CHANGE ───────────────────────────────────────────────────
  async bulkStatusChange(ids: string[], status: ProductStatus, userId: string) {
    const results = await Promise.allSettled(
      ids.map((id) => this.changeStatus(id, status, userId, UserRole.SUPER_ADMIN)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      message: `Updated ${succeeded} products. ${failed} failed.`,
      data: { succeeded, failed, total: ids.length },
    };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────
  private async _saveStones(productId: string, stones: any[]) {
    const stoneEntities: ProductStone[] = stones.map((s) => {
      // Enforce: weightInGrams = carats * 0.200
      const weightInUnit = Number(s.weightInUnit ?? s.carats ?? 0);
      const unit = s.unit ?? StoneUnit.CARATS;
      const weightInGrams =
        unit === StoneUnit.CARATS
          ? weightInUnit * 0.2
          : (weightInUnit / 100) * 0.2; // cents → carats → grams

      const count = s.count ?? 1;
      const pricePerUnit = Number(s.pricePerUnit ?? 0);
      const totalStonePrice = s.isFlatPrice
        ? Number(s.totalStonePrice ?? 0)
        : count * weightInUnit * pricePerUnit;

      return this.stoneRepo.create({
        ...s,
        productId,
        weightInGrams: parseFloat(weightInGrams.toFixed(3)),
        totalStonePrice: parseFloat(totalStonePrice.toFixed(2)),
      } as any) as unknown as ProductStone;
    });

    await this.stoneRepo.save(stoneEntities);
  }
}
