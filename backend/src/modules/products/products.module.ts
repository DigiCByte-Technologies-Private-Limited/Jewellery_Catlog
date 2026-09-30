import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductStone } from './entities/product-stone.entity';
import { ProductMedia } from './entities/product-media.entity';
import { MetalRatesModule } from '../metal-rates/metal-rates.module';
import { PricingModule } from '../pricing/pricing.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductStone, ProductMedia]),
    MetalRatesModule,
    PricingModule,
    AuditModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
