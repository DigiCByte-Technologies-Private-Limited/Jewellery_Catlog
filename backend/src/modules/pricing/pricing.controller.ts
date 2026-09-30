import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingCalculatorService, PriceCalculationInput } from './pricing-calculator.service';
import { MetalRatesService } from '../metal-rates/metal-rates.service';
import { MetalType, MetalPurity, PricingMode } from '../../common/enums';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingCalculatorService,
    private readonly metalRatesService: MetalRatesService,
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
}
