import {
  Controller,
  Post,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingCalculatorService, PriceCalculationInput } from './pricing-calculator.service';
import { MetalRatesService } from '../metal-rates/metal-rates.service';
import { MetalType, MetalPurity, PricingMode } from '../../common/enums';
import { Product } from '../products/entities/product.entity';
import { ProductStone } from '../products/entities/product-stone.entity';

export interface CartValidationItemInput {
  productId: string;
  quantity?: number;
  clientPrice: number;
}

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingCalculatorService,
    private readonly metalRatesService: MetalRatesService,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate price breakdown from product fields (no auth needed for preview)' })
  async calculate(@Body() body: PriceCalculationInput & { metalType?: MetalType; purity?: MetalPurity }) {
    let metalRatePerGram = body.metalRatePerGram;

    // If no rate provided, fetch current rate from DB
    if (!metalRatePerGram && body.metalType && body.purity) {
      const rate = await this.metalRatesService.getRateForPurity(body.metalType, body.purity);
      if (rate) metalRatePerGram = Number(rate.ratePerGram);
    }

    const result = this.pricingService.calculate({ ...body, metalRatePerGram: metalRatePerGram ?? 0 });
    return { success: true, data: result };
  }

  @Post('calculate-bulk')
  @ApiOperation({ summary: 'Calculate prices for multiple product inputs at once' })
  calculateBulk(@Body() body: { items: PriceCalculationInput[] }) {
    const results = this.pricingService.calculateBulk(body.items);
    return { success: true, data: results };
  }

  @Post('validate-cart')
  @ApiOperation({
    summary: 'Validate cart prices against current backend metal rates and recalculate exact totals',
  })
  async validateCart(@Body() body: { items: CartValidationItemInput[] }) {
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Items array is required for cart validation');
    }

    let hasPriceChanged = false;
    let totalClientPrice = 0;
    let totalCurrentPrice = 0;
    const validatedItems: any[] = [];
    const changeNotices: string[] = [];

    for (const item of body.items) {
      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const clientPrice = Number(item.clientPrice) || 0;
      totalClientPrice += clientPrice * quantity;

      const product = await this.productRepo.findOne({
        where: { id: item.productId },
        relations: { stones: true },
      });

      if (!product) {
        // If product ID not in DB (e.g. bespoke clienteling custom 3D model), pass through client price safely
        validatedItems.push({
          productId: item.productId,
          name: 'Custom Atelier Commission',
          sku: 'BESPOKE-01',
          quantity,
          clientPrice,
          currentPrice: clientPrice,
          priceDifference: 0,
          hasChanged: false,
        });
        totalCurrentPrice += clientPrice * quantity;
        continue;
      }

      // Fetch active rate
      const metalRate = await this.metalRatesService.getRateForPurity(
        product.metalType,
        product.purity,
      );
      const metalRatePerGram = metalRate ? Number(metalRate.ratePerGram) : 0;

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

      const currentPrice = breakdown.finalPriceRounded;
      totalCurrentPrice += currentPrice * quantity;

      const priceDifference = currentPrice - clientPrice;
      const itemChanged = Math.abs(priceDifference) > 0;

      if (itemChanged) {
        hasPriceChanged = true;
        changeNotices.push(
          `The price of "${product.name}" has updated from ₹${clientPrice.toLocaleString(
            'en-IN',
          )} to ₹${currentPrice.toLocaleString('en-IN')} based on current benchmark metal rates.`,
        );
      }

      validatedItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        metalType: product.metalType,
        purity: product.purity,
        metalRatePerGram,
        quantity,
        clientPrice,
        currentPrice,
        priceDifference,
        hasChanged: itemChanged,
        breakdown,
      });
    }

    return {
      success: true,
      data: {
        isValid: !hasPriceChanged,
        hasPriceChanged,
        items: validatedItems,
        totalClientPrice: Math.round(totalClientPrice),
        totalCurrentPrice: Math.round(totalCurrentPrice),
        totalDifference: Math.round(totalCurrentPrice - totalClientPrice),
        message: hasPriceChanged
          ? changeNotices.join(' ')
          : 'Cart prices are up-to-date with current metal benchmark rates.',
      },
    };
  }

  @Post('order-snapshot')
  @ApiOperation({
    summary: 'Generate an immutable price snapshot for order creation and historical persistence',
  })
  async createOrderSnapshot(@Body() body: { productId: string; quantity?: number }) {
    const product = await this.productRepo.findOne({
      where: { id: body.productId },
      relations: { stones: true },
    });

    if (!product) throw new NotFoundException(`Product ${body.productId} not found`);

    const metalRate = await this.metalRatesService.getRateForPurity(
      product.metalType,
      product.purity,
    );
    const metalRatePerGram = metalRate ? Number(metalRate.ratePerGram) : 0;

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

    const snapshot = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      metalType: product.metalType,
      purity: product.purity,
      metalRatePerGram,
      grossWeight: Number(product.grossWeight),
      netMetalWeight: Number(product.netMetalWeight || product.grossWeight),
      metalValue: breakdown.metalValue,
      wastagePercent: breakdown.wastagePercent,
      wastageValue: breakdown.wastageValue,
      makingChargeType: breakdown.makingChargeType,
      makingChargeValue: breakdown.makingChargeValue,
      makingChargesAmount: breakdown.makingChargesAmount,
      serviceCharges: breakdown.serviceCharges,
      totalStoneValue: breakdown.totalStoneValue,
      taxableAmount: breakdown.taxableAmount,
      gstRatePercent: breakdown.gstRatePercent,
      gstAmount: breakdown.gstAmount,
      finalPrice: breakdown.finalPriceRounded,
      snapshotAt: new Date().toISOString(),
    };

    return { success: true, data: snapshot };
  }
}
