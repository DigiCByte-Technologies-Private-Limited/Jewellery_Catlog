import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KarigarService } from './karigar.service';
import { KarigarController } from './karigar.controller';
import { Karigar } from './entities/karigar.entity';
import { KarigarOrder } from './entities/karigar-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Karigar, KarigarOrder])],
  controllers: [KarigarController],
  providers: [KarigarService],
  exports: [KarigarService],
})
export class KarigarModule {}
