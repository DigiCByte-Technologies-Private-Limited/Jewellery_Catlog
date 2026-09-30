import { Module } from '@nestjs/common';
import { PricingCalculatorService } from './pricing-calculator.service';
import { PricingController } from './pricing.controller';
import { MetalRatesModule } from '../metal-rates/metal-rates.module';

@Module({
  imports: [MetalRatesModule],
  controllers: [PricingController],
  providers: [PricingCalculatorService],
  exports: [PricingCalculatorService],
})
export class PricingModule {}
