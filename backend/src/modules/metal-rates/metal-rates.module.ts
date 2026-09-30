import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetalRatesService } from './metal-rates.service';
import { MetalRatesController } from './metal-rates.controller';
import { MetalRate } from './entities/metal-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetalRate])],
  controllers: [MetalRatesController],
  providers: [MetalRatesService],
  exports: [MetalRatesService],
})
export class MetalRatesModule {}
