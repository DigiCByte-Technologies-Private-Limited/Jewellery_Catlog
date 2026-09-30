import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Karigar } from './entities/karigar.entity';
import { KarigarOrder } from './entities/karigar-order.entity';
import { KarigarOrderStatus, MetalType, MetalPurity } from '../../common/enums';

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JO-${year}-${rand}`;
}

@Injectable()
export class KarigarService {
  constructor(
    @InjectRepository(Karigar)
    private readonly karigarRepo: Repository<Karigar>,
    @InjectRepository(KarigarOrder)
    private readonly orderRepo: Repository<KarigarOrder>,
  ) {}

  // ─── KARIGARS ─────────────────────────────────────────────────────────────
  async getKarigars() {
    const karigars = await this.karigarRepo.find({ order: { name: 'ASC' } });
    return { success: true, data: karigars };
  }

  async createKarigar(dto: {
    name: string;
    code?: string;
    phone: string;
    email?: string;
    panNumber?: string;
    skills?: string;
    defaultMakingChargeRate?: number;
  }) {
    let code = dto.code || `KRG-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await this.karigarRepo.findOne({ where: { code } });
    if (existing) {
      if (dto.code) throw new ConflictException(`Karigar code ${dto.code} already exists`);
      code = `KRG-${Date.now().toString().slice(-4)}`;
    }

    const karigar = this.karigarRepo.create({
      ...dto,
      code,
      goldBalanceGrams: 0,
      silverBalanceGrams: 0,
      defaultMakingChargeRate: dto.defaultMakingChargeRate ?? 0,
      isActive: true,
    } as any);

    await this.karigarRepo.save(karigar);
    return { success: true, message: 'Karigar profile created', data: karigar };
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────
  async getOrders(query: { karigarId?: string; status?: KarigarOrderStatus; page?: number; limit?: number }) {
    const { karigarId, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.karigar', 'karigar')
      .leftJoinAndSelect('o.product', 'product')
      .skip(skip)
      .take(limit)
      .orderBy('o.createdAt', 'DESC');

    if (karigarId) qb.andWhere('o.karigarId = :karigarId', { karigarId });
    if (status) qb.andWhere('o.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── ISSUE JOB ORDER (METAL GRAINS / BARS ISSUED) ─────────────────────────
  async issueOrder(dto: {
    karigarId: string;
    productId?: string;
    metalType: MetalType;
    purity: MetalPurity;
    issuedWeight: number;
    allowedWastagePercent?: number;
    laborCharges?: number;
    targetDeliveryDate?: Date;
    notes?: string;
  }) {
    if (dto.issuedWeight <= 0) throw new BadRequestException('Issued weight must be positive');

    const karigar = await this.karigarRepo.findOne({ where: { id: dto.karigarId } });
    if (!karigar) throw new NotFoundException('Karigar not found');

    const orderNumber = generateOrderNumber();
    const wastagePct = dto.allowedWastagePercent ?? 1.5;
    const allowedWastageGrams = parseFloat(((dto.issuedWeight * wastagePct) / 100).toFixed(3));
    const purity = dto.purity || (dto as any).issuedPurity || MetalPurity.K22;

    const order = this.orderRepo.create({
      orderNumber,
      karigarId: dto.karigarId,
      productId: dto.productId ?? null,
      metalType: dto.metalType || MetalType.GOLD,
      purity,
      issuedWeight: dto.issuedWeight,
      allowedWastagePercent: wastagePct,
      allowedWastageGrams,
      laborCharges: dto.laborCharges ?? 0,
      targetDeliveryDate: dto.targetDeliveryDate ?? null,
      notes: dto.notes ?? null,
      status: KarigarOrderStatus.ISSUED,
    } as any);

    await this.orderRepo.save(order);

    // Increase karigar's metal balance (karigar now owes this metal to the shop)
    if (dto.metalType === MetalType.GOLD) {
      karigar.goldBalanceGrams = Number(karigar.goldBalanceGrams) + Number(dto.issuedWeight);
    } else {
      karigar.silverBalanceGrams = Number(karigar.silverBalanceGrams) + Number(dto.issuedWeight);
    }
    await this.karigarRepo.save(karigar);

    return { success: true, message: `Job Order ${orderNumber} issued to ${karigar.name}`, data: order };
  }

  // ─── RECEIVE FINISHED PIECE & RECONCILE ────────────────────────────────────
  async receiveOrder(orderId: string, dto: {
    finishedWeight: number;
    scrapWeight: number;
    laborCharges?: number;
    notes?: string;
  }) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { karigar: true },
    });
    if (!order) throw new NotFoundException('Job order not found');
    if (order.status !== KarigarOrderStatus.ISSUED && order.status !== KarigarOrderStatus.IN_PROGRESS) {
      throw new BadRequestException(`Order is already in ${order.status} state`);
    }

    const karigar = order.karigar;
    const finishedWeight = Number(dto.finishedWeight ?? (dto as any).receivedFinishedWeight);
    const scrapWeight = Number(dto.scrapWeight ?? (dto as any).receivedScrapWeight ?? 0);
    const allowedWastage = Number(order.allowedWastageGrams);

    // Metal Reconciliation Formula:
    // Issued - (Finished Piece + Returned Scrap + Allowed Loss) = Net Variance
    const totalAccounted = finishedWeight + scrapWeight + allowedWastage;
    const netDifferenceGrams = parseFloat((Number(order.issuedWeight) - totalAccounted).toFixed(3));

    order.finishedWeight = finishedWeight;
    order.scrapWeight = scrapWeight;
    order.netDifferenceGrams = netDifferenceGrams;
    if (dto.laborCharges !== undefined) order.laborCharges = dto.laborCharges;
    order.status = KarigarOrderStatus.RECONCILED;
    order.completedAt = new Date();
    order.notes = dto.notes ?? order.notes;

    await this.orderRepo.save(order);

    // Update karigar metal balance: deduct finished + scrap
    // If netDifference > 0 (karigar has metal shortage), shortage remains on their ledger
    const metalReturned = finishedWeight + scrapWeight + allowedWastage;
    if (order.metalType === MetalType.GOLD) {
      karigar.goldBalanceGrams = Math.max(0, Number(karigar.goldBalanceGrams) - metalReturned);
    } else {
      karigar.silverBalanceGrams = Math.max(0, Number(karigar.silverBalanceGrams) - metalReturned);
    }
    await this.karigarRepo.save(karigar);

    return {
      success: true,
      message: `Job Order ${order.orderNumber} reconciled successfully`,
      data: {
        order,
        reconciliation: {
          issuedWeight: order.issuedWeight,
          finishedWeight,
          scrapWeight,
          allowedWastage,
          netDifferenceGrams,
          laborCharges: order.laborCharges,
        },
      },
    };
  }
}
