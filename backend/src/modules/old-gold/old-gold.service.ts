import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OldGoldTransaction } from './entities/old-gold-transaction.entity';
import { MetalRatesService } from '../metal-rates/metal-rates.service';
import { MetalType, MetalPurity, OldGoldStatus, OldGoldPaymentMode } from '../../common/enums';

function generateVoucherNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `OG-${year}-${rand}`;
}

@Injectable()
export class OldGoldService {
  constructor(
    @InjectRepository(OldGoldTransaction)
    private readonly transactionRepo: Repository<OldGoldTransaction>,
    private readonly metalRatesService: MetalRatesService,
  ) {}

  // ─── ASSESS OLD GOLD VALUATION ────────────────────────────────────────────
  async assessOldGold(dto: {
    metalType: MetalType;
    grossWeight: number;
    stoneWeight?: number;
    enamelLacWeight?: number;
    testedPurityPercent: number; // e.g. 91.60
    meltingLossPercent?: number; // e.g. 1.0
  }) {
    const gross = Number(dto.grossWeight);
    const stone = Number(dto.stoneWeight || 0);
    const lac = Number(dto.enamelLacWeight || 0);

    if (stone + lac >= gross) {
      throw new BadRequestException('Stone + lac weight cannot exceed or equal gross weight');
    }

    const netWeight = parseFloat((gross - stone - lac).toFixed(3));
    const purity = Number(dto.testedPurityPercent || ((dto as any).karat ? (((dto as any).karat / 24) * 100) : 91.6));
    const meltLoss = Number(dto.meltingLossPercent ?? 1.0);

    // Fine 24K gold weight formula:
    // netWeight * (purity / 100) * (1 - meltLoss / 100)
    const netFineGoldGrams = parseFloat(
      (netWeight * (purity / 100) * (1 - meltLoss / 100)).toFixed(3),
    );

    // Fetch today's 24K benchmark rate
    const rateRecord = await this.metalRatesService.getRateForPurity(
      dto.metalType,
      dto.metalType === MetalType.GOLD ? MetalPurity.K24 : MetalPurity.SILVER_999,
    );
    const buyRatePerGram = rateRecord ? Number(rateRecord.ratePerGram) : 6200;
    const totalValuation = parseFloat((netFineGoldGrams * buyRatePerGram).toFixed(2));

    return {
      success: true,
      data: {
        metalType: dto.metalType,
        grossWeight: gross,
        stoneWeight: stone,
        enamelLacWeight: lac,
        netWeight,
        testedPurityPercent: purity,
        meltingLossPercent: meltLoss,
        netFineGoldGrams,
        buyRatePerGram,
        totalValuation,
        recommendedPaymentMode: OldGoldPaymentMode.EXCHANGE_CREDIT,
      },
    };
  }

  // ─── CREATE ACCEPTED TRANSACTION ──────────────────────────────────────────
  async createTransaction(dto: {
    customerName: string;
    customerPhone: string;
    customerPan?: string;
    metalType: MetalType;
    grossWeight: number;
    stoneWeight?: number;
    enamelLacWeight?: number;
    testedPurityPercent: number;
    testingMethod?: string;
    meltingLossPercent?: number;
    paymentMode?: OldGoldPaymentMode;
    notes?: string;
  }, userId?: string) {
    const assessment = await this.assessOldGold({
      metalType: dto.metalType,
      grossWeight: dto.grossWeight,
      stoneWeight: dto.stoneWeight,
      enamelLacWeight: dto.enamelLacWeight,
      testedPurityPercent: dto.testedPurityPercent,
      meltingLossPercent: dto.meltingLossPercent,
    });

    const d = assessment.data;
    const voucherNumber = generateVoucherNumber();

    const transaction = this.transactionRepo.create({
      voucherNumber,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerPan: dto.customerPan ?? null,
      metalType: dto.metalType,
      grossWeight: d.grossWeight,
      stoneWeight: d.stoneWeight,
      enamelLacWeight: d.enamelLacWeight,
      netWeight: d.netWeight,
      testedPurityPercent: d.testedPurityPercent,
      testingMethod: dto.testingMethod || 'XRF_KARATMETER',
      meltingLossPercent: d.meltingLossPercent,
      netFineGoldGrams: d.netFineGoldGrams,
      buyRatePerGram: d.buyRatePerGram,
      totalValuation: d.totalValuation,
      paymentMode: ((dto.paymentMode as any) === 'STORE_CREDIT' || !dto.paymentMode) ? OldGoldPaymentMode.EXCHANGE_CREDIT : dto.paymentMode,
      status: OldGoldStatus.ACCEPTED,
      notes: dto.notes ?? null,
      createdById: userId ?? null,
    } as any);

    await this.transactionRepo.save(transaction);
    return {
      success: true,
      message: `Old Gold Voucher ${voucherNumber} generated for ₹${d.totalValuation.toLocaleString('en-IN')}`,
      data: transaction,
    };
  }

  // ─── LIST TRANSACTIONS ────────────────────────────────────────────────────
  async getTransactions(query: { status?: OldGoldStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .skip(skip)
      .take(limit)
      .orderBy('t.createdAt', 'DESC');

    if (status) qb.andWhere('t.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
