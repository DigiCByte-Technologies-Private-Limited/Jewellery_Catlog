import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetalRatesService } from './metal-rates.service';
import { MetalRatesController } from './metal-rates.controller';
import { MetalRate } from './entities/metal-rate.entity';
import { Product } from '../products/entities/product.entity';
import { AuditModule } from '../audit/audit.module';
import { PricingCalculatorService } from '../pricing/pricing-calculator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetalRate, Product]),
    AuditModule,
  ],
  controllers: [MetalRatesController],
  providers: [MetalRatesService, PricingCalculatorService],
  exports: [MetalRatesService],
})
export class MetalRatesModule {}

