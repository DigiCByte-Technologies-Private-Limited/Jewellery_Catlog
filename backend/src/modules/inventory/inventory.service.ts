import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { ItemTag } from './entities/item-tag.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { ItemTagStatus, InventoryMovementType, LocationType } from '../../common/enums';

function generateTagNumber(): string {
  const prefix = 'TAG';
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${random}`;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(ItemTag)
    private readonly itemTagRepo: Repository<ItemTag>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // ─── LOCATIONS ────────────────────────────────────────────────────────────
  async getLocations() {
    const locations = await this.locationRepo.find({ order: { name: 'ASC' } });
    return { success: true, data: locations };
  }

  async createLocation(dto: { name: string; code: string; type: LocationType; city?: string }) {
    const existing = await this.locationRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Location code ${dto.code} already exists`);

    const location = this.locationRepo.create(dto as any);
    await this.locationRepo.save(location);
    return { success: true, data: location };
  }

  // ─── ITEM TAGS (PHYSICAL PIECES) ──────────────────────────────────────────
  async getItemTags(query: {
    page?: number;
    limit?: number;
    locationId?: string;
    status?: ItemTagStatus;
    search?: string;
  }) {
    const { page = 1, limit = 50, locationId, status, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.itemTagRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.product', 'product')
      .leftJoinAndSelect('t.location', 'location')
      .skip(skip)
      .take(limit)
      .orderBy('t.createdAt', 'DESC');

    if (locationId) qb.andWhere('t.locationId = :locationId', { locationId });
    if (status) qb.andWhere('t.status = :status', { status });
    if (search) {
      qb.andWhere('(LOWER(t.tagNumber) LIKE :search OR LOWER(t.huid) LIKE :search OR LOWER(product.name) LIKE :search)', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createItemTag(dto: {
    productId: string;
    locationId: string;
    grossWeight: number;
    stoneWeight?: number;
    lacWeight?: number;
    huid?: string;
    trayNumber?: string;
    notes?: string;
  }, userId?: string) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const location = await this.locationRepo.findOne({ where: { id: dto.locationId } });
    if (!location) throw new NotFoundException('Location not found');

    if (dto.huid) {
      const existingHuid = await this.itemTagRepo.findOne({ where: { huid: dto.huid } });
      if (existingHuid) throw new ConflictException(`HUID ${dto.huid} is already registered on another item piece`);
    }

    const stoneWeight = dto.stoneWeight ?? 0;
    const lacWeight = dto.lacWeight ?? 0;
    if (stoneWeight + lacWeight > dto.grossWeight) {
      throw new BadRequestException('Stone weight + lac weight cannot exceed gross weight');
    }
    const netMetalWeight = dto.grossWeight - stoneWeight - lacWeight;

    const tagNumber = generateTagNumber();
    const itemTag = this.itemTagRepo.create({
      tagNumber,
      huid: dto.huid ? dto.huid.toUpperCase().trim() : null,
      productId: dto.productId,
      locationId: dto.locationId,
      grossWeight: dto.grossWeight,
      stoneWeight,
      lacWeight,
      netMetalWeight,
      trayNumber: dto.trayNumber ?? null,
      notes: dto.notes ?? null,
      status: ItemTagStatus.IN_STOCK,
      createdById: userId ?? null,
    } as any);

    await this.itemTagRepo.save(itemTag);

    // Record initial STOCK_IN movement
    const movement = this.movementRepo.create({
      itemTagId: (itemTag as any).id,
      type: InventoryMovementType.STOCK_IN,
      fromLocationId: null,
      toLocationId: dto.locationId,
      weight: dto.grossWeight,
      reason: 'Physical inventory stock in',
      performedById: userId ?? null,
    } as any);
    await this.movementRepo.save(movement);

    return { success: true, message: 'Physical item tag created', data: itemTag };
  }

  // ─── STOCK TRANSFER (e.g. Vault to Showroom Counter) ──────────────────────
  async transferStock(dto: {
    itemTagId: string;
    toLocationId: string;
    reason?: string;
  }, userId?: string) {
    const item = await this.itemTagRepo.findOne({ where: { id: dto.itemTagId } });
    if (!item) throw new NotFoundException('Item tag not found');

    const toLoc = await this.locationRepo.findOne({ where: { id: dto.toLocationId } });
    if (!toLoc) throw new NotFoundException('Destination location not found');

    if (item.locationId === dto.toLocationId) {
      throw new BadRequestException('Item is already in this location');
    }

    const fromLocationId = item.locationId;
    item.locationId = dto.toLocationId;
    await this.itemTagRepo.save(item);

    // Record movement
    const movement = this.movementRepo.create({
      itemTagId: item.id,
      type: InventoryMovementType.TRANSFER,
      fromLocationId,
      toLocationId: dto.toLocationId,
      weight: item.grossWeight,
      reason: dto.reason || 'Location transfer',
      performedById: userId ?? null,
    } as any);
    await this.movementRepo.save(movement);

    return { success: true, message: 'Stock transferred successfully', data: item };
  }

  // ─── MEMO ISSUE & RETURN ──────────────────────────────────────────────────
  async issueMemo(itemTagId: string, memoHolderName: string, notes?: string, userId?: string) {
    const item = await this.itemTagRepo.findOne({ where: { id: itemTagId } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.status !== ItemTagStatus.IN_STOCK) {
      throw new BadRequestException(`Cannot issue memo for item currently in status ${item.status}`);
    }

    item.status = ItemTagStatus.ON_MEMO;
    item.memoHolderName = memoHolderName;
    item.notes = notes ?? item.notes;
    await this.itemTagRepo.save(item);

    const movement = this.movementRepo.create({
      itemTagId: item.id,
      type: InventoryMovementType.MEMO_ISSUE,
      fromLocationId: item.locationId,
      toLocationId: null,
      weight: item.grossWeight,
      reason: `Memo issued to: ${memoHolderName}`,
      performedById: userId ?? null,
    } as any);
    await this.movementRepo.save(movement);

    return { success: true, message: `Item issued on memo to ${memoHolderName}`, data: item };
  }

  async returnMemo(itemTagId: string, returnLocationId?: string, userId?: string) {
    const item = await this.itemTagRepo.findOne({ where: { id: itemTagId } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.status !== ItemTagStatus.ON_MEMO) {
      throw new BadRequestException('Item is not on memo');
    }

    item.status = ItemTagStatus.IN_STOCK;
    const memoHolder = item.memoHolderName;
    item.memoHolderName = null;
    if (returnLocationId) item.locationId = returnLocationId;
    await this.itemTagRepo.save(item);

    const movement = this.movementRepo.create({
      itemTagId: item.id,
      type: InventoryMovementType.MEMO_RETURN,
      fromLocationId: null,
      toLocationId: item.locationId,
      weight: item.grossWeight,
      reason: `Returned from memo (${memoHolder})`,
      performedById: userId ?? null,
    } as any);
    await this.movementRepo.save(movement);

    return { success: true, message: 'Item returned from memo to active stock', data: item };
  }

  // ─── STOCK SUMMARY REPORT ─────────────────────────────────────────────────
  async getStockSummary() {
    const items = await this.itemTagRepo.find({
      relations: { product: true, location: true },
    });

    const totalPieces = items.length;
    const totalGrossWeight = items.reduce((s, i) => s + Number(i.grossWeight), 0);
    const totalNetWeight = items.reduce((s, i) => s + Number(i.netMetalWeight), 0);

    const byLocation: Record<string, { name: string; count: number; grossWeight: number }> = {};
    for (const item of items) {
      const locName = item.location?.name || 'Unassigned';
      if (!byLocation[locName]) {
        byLocation[locName] = { name: locName, count: 0, grossWeight: 0 };
      }
      byLocation[locName].count += 1;
      byLocation[locName].grossWeight += Number(item.grossWeight);
    }

    return {
      success: true,
      data: {
        totalPieces,
        totalGrossWeight: parseFloat(totalGrossWeight.toFixed(3)),
        totalNetWeight: parseFloat(totalNetWeight.toFixed(3)),
        byLocation: Object.values(byLocation),
      },
    };
  }
}
