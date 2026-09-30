import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OldGoldService } from './old-gold.service';
import { OldGoldController } from './old-gold.controller';
import { OldGoldTransaction } from './entities/old-gold-transaction.entity';
import { MetalRatesModule } from '../metal-rates/metal-rates.module';

@Module({
  imports: [TypeOrmModule.forFeature([OldGoldTransaction]), MetalRatesModule],
  controllers: [OldGoldController],
  providers: [OldGoldService],
  exports: [OldGoldService],
})
export class OldGoldModule {}
