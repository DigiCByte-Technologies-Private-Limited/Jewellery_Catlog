import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingCalculatorService } from './pricing-calculator.service';
import { PricingController } from './pricing.controller';
import { MetalRatesModule } from '../metal-rates/metal-rates.module';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    MetalRatesModule,
  ],
  controllers: [PricingController],
  providers: [PricingCalculatorService],
  exports: [PricingCalculatorService],
})
export class PricingModule {}
